import React, { useState, useEffect, useRef } from 'react';
import { Squeak, UserProfile, Message, CustomEmoji, Nest } from '../types';
import { sendSqueakMessage, toggleMessageReaction, deleteMessage, db, listenToCustomEmojis, addCustomEmoji, saveUserProfileInFirestore } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Send, Smile, Trash2, ShieldAlert, Sparkles, MessageSquare, Image, X, Link, Upload, Share2, Copy, Check, Download, MoreVertical, Plus, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatPanelProps {
  squeak: Squeak;
  currentUser: UserProfile;
  messages: Message[];
  onStartDm?: (userId: string) => void;
  onUpdateCurrentUser?: (updated: UserProfile) => void;
  allSqueaks?: Squeak[];
  allNests?: Nest[];
  allUsers?: UserProfile[];
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '✨', '🐀', '🧀'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  squeak,
  currentUser,
  messages,
  onStartDm,
  onUpdateCurrentUser,
  allSqueaks = [],
  allNests = [],
  allUsers = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  
  // Custom Emojis states
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [isEmojiUploadOpen, setIsEmojiUploadOpen] = useState(false);
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiUrl, setNewEmojiUrl] = useState('');

  // Floating Context Menu state
  const [activeMenuMessage, setActiveMenuMessage] = useState<Message | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  // Forward Squeak Modal state
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // UI Toast confirmations
  const [toastMessage, setToastMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<any>(null);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Real-time custom emojis subscription
  useEffect(() => {
    const unsubscribe = listenToCustomEmojis((loaded) => {
      setCustomEmojis(loaded);
    });
    return () => unsubscribe();
  }, []);

  // Auto Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch (err) {
      console.warn('Direct blob copy failed, trying fallback to text copy:', err);
      try {
        await navigator.clipboard.writeText(url);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback image link copy failed:', fallbackErr);
      }
    }
  };

  const handleSaveImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `shrew-chat-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setImageSaved(true);
      setTimeout(() => setImageSaved(false), 2000);
    } catch (err) {
      console.warn('Image download fetch failed, opening in new tab instead:', err);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !attachedImageUrl) return;

    setInputText('');
    setAttachedImageUrl('');
    setShowUrlInput(false);
    setShowEmojiPicker(false);

    try {
      await sendSqueakMessage(
        squeak.nestId,
        squeak.id,
        currentUser.id,
        currentUser.name,
        currentUser.avatarColor,
        currentUser.avatarUrl || currentUser.avatarIcon,
        text,
        attachedImageUrl || undefined
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await toggleMessageReaction(messageId, emoji, currentUser.id);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      showToast('Mensaje borrado con éxito');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenUserProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setSelectedUserProfile(snapshot.data() as UserProfile);
      } else {
        // Fallback with what we have from the message
        const msg = messages.find(m => m.senderId === userId);
        if (msg) {
          setSelectedUserProfile({
            id: userId,
            name: msg.senderName,
            username: msg.senderName.toLowerCase().replace(/\s+/g, '_'),
            avatarColor: msg.senderColor,
            avatarIcon: msg.senderAvatar || '🐀',
            status: 'offline',
            joinedAt: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Helper to parse message text and render custom emojis inline as clean visual objects
  const renderContentWithEmojis = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(:[a-z0-9_]+:)/g);
    return (
      <p className="inline-wrap break-words">
        {parts.map((part, idx) => {
          if (part.startsWith(':') && part.endsWith(':')) {
            const emojiName = part.slice(1, -1);
            const foundEmoji = customEmojis.find(e => e.name === emojiName);
            if (foundEmoji) {
              return (
                <img
                  key={idx}
                  src={foundEmoji.url}
                  alt={emojiName}
                  title={`:${emojiName}:`}
                  className="inline-block h-6 w-6 object-contain mx-0.5 align-middle select-none rounded bg-black/10 p-0.5"
                  referrerPolicy="no-referrer"
                />
              );
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  // Touch and click handlers for the floating actions list
  const handleTouchStart = (msg: Message, e: React.TouchEvent) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveMenuMessage(msg);
      const touch = e.touches[0];
      setMenuCoords({ x: touch.clientX, y: touch.clientY - 20 });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenuMessage(msg);
    setMenuCoords({ x: e.clientX, y: e.clientY - 20 });
  };

  return (
    <div 
      className="flex-1 bg-transparent flex flex-col justify-between overflow-hidden relative"
      id="chat-panel-container"
    >
      {/* Decorative subtle header line or card layout */}
      <div className="px-4 py-3 bg-zinc-900/30 backdrop-blur-md border-b border-zinc-900/40 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="text-amber-500 font-black">»</span>
            {squeak.name}
          </h4>
          {squeak.description && (
            <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[200px]">
              {squeak.description}
            </p>
          )}
        </div>
        <div className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
          SQUEAK STREAM
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth scrollbar-none">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mb-3 animate-bounce">
              🧀
            </div>
            <h5 className="text-sm font-bold text-zinc-300">¡Nido súper limpio!</h5>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
              No hay mensajes aquí aún. Di algo arrastrando tus bigotes.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const isBlocked = currentUser.blockedUsers?.includes(msg.senderId);

              if (isBlocked) {
                return (
                  <div 
                    key={msg.id} 
                    className="w-full text-center py-2 bg-zinc-950/40 border border-zinc-900/60 rounded-xl text-[10px] text-zinc-600 font-mono my-1 select-none flex items-center justify-center gap-1"
                  >
                    <span>🔇 Mensaje de musaraña bloqueada</span>
                    <button
                      onClick={async () => {
                        const updatedBlocked = (currentUser.blockedUsers || []).filter(id => id !== msg.senderId);
                        const updated = { ...currentUser, blockedUsers: updatedBlocked };
                        if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                        else {
                          localStorage.setItem('shrew_user_profile', JSON.stringify(updated));
                          await saveUserProfileInFirestore(updated);
                        }
                        showToast('Usuario desbloqueado');
                      }}
                      className="text-amber-500 hover:underline cursor-pointer ml-1 font-bold"
                    >
                      (Desbloquear)
                    </button>
                  </div>
                );
              }
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 max-w-[85%] relative group ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  id={`message-${msg.id}`}
                  onContextMenu={(e) => handleContextMenu(msg, e)}
                  onTouchStart={(e) => handleTouchStart(msg, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {/* Sender Avatar */}
                  <button
                    onClick={() => handleOpenUserProfile(msg.senderId)}
                    className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-inner border border-zinc-900 hover:scale-105 transition-all overflow-hidden cursor-pointer"
                    style={{ backgroundColor: `${msg.senderColor}22` }}
                    title={`Ver perfil de ${msg.senderName}`}
                  >
                    {msg.senderAvatar?.startsWith('data:') || msg.senderAvatar?.startsWith('http') ? (
                      <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                    ) : (
                      msg.senderAvatar || '🐭'
                    )}
                  </button>

                  {/* Message Core Bubble */}
                  <div className="space-y-1.5 flex-1 min-w-0 relative">
                    
                    {/* Username & Metadata */}
                    <div className={`flex items-center gap-2 text-[10px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <button
                        onClick={() => handleOpenUserProfile(msg.senderId)}
                        className="font-bold text-zinc-300 truncate hover:underline cursor-pointer text-left flex items-center gap-1"
                        style={{ color: msg.senderColor }}
                      >
                        <span>{isMe ? 'Tú' : msg.senderName}</span>
                        {/* Friendly Indicator badge */}
                        {currentUser.friends?.includes(msg.senderId) && (
                          <span className="bg-purple-500/20 text-purple-400 text-[8px] px-1 rounded font-normal">Amigo</span>
                        )}
                      </button>
                      <span className="text-zinc-600 font-mono">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Chat Bubble Body */}
                    <div
                      className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-sm border group-hover:border-zinc-700/80 transition-all ${
                        isMe
                          ? 'bg-amber-500 text-black border-amber-400 font-medium rounded-tr-none'
                          : 'bg-zinc-900/90 text-zinc-100 border-zinc-800/80 rounded-tl-none'
                      }`}
                    >
                      {/* Sub-menu hover helper trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMessage(msg);
                          setMenuCoords({ x: e.clientX, y: e.clientY - 40 });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1.5 top-1.5 text-zinc-500 hover:text-white cursor-pointer p-0.5 rounded bg-black/40 hover:bg-black/80 z-10"
                        title="Opciones de mensaje"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {msg.content && (
                        <div className="pr-3">
                          {renderContentWithEmojis(msg.content)}
                        </div>
                      )}

                      {msg.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-black/10 max-w-full max-h-60 bg-black/25 flex items-center justify-center">
                          <img 
                            src={msg.imageUrl} 
                            alt="Squeak media" 
                            className="max-w-full max-h-60 object-contain hover:scale-[1.01] transition-all cursor-pointer rounded-lg" 
                            referrerPolicy="no-referrer" 
                            onClick={() => setActiveImageUrl(msg.imageUrl || null)}
                          />
                        </div>
                      )}

                      {/* Floating Trash Action */}
                      {isMe && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 border border-zinc-950 cursor-pointer shadow-lg z-10"
                          title="Eliminar Squeak"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Reactions Board */}
                    <div className={`flex flex-wrap gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Active reaction buttons */}
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, r]) => {
                          const reactors = r as string[];
                          const hasReacted = reactors.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
                                hasReacted
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                  : 'bg-zinc-900/50 border-zinc-850 text-zinc-500 hover:border-zinc-700'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[9px] font-bold">{reactors.length}</span>
                            </button>
                          );
                        })}

                      {/* Reaction Trigger Button (Quick picker popover) */}
                      <div className="relative inline-block group/reaction">
                        <button className="w-5 h-5 rounded-md bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-850">
                          +
                        </button>
                        
                        {/* Hover emoji drawer */}
                        <div className="absolute bottom-6 left-0 hidden group-hover/reaction:flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl shadow-xl gap-1 z-30 animate-fade-in">
                          {COMMON_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-900 text-xs transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Overlay Drawer */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-20 left-4 right-4 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl shadow-2xl z-25 max-h-72 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Emojis Estándar</span>
              <button
                type="button"
                onClick={() => setIsEmojiUploadOpen(true)}
                className="text-[9px] bg-amber-500 text-black px-2 py-1 rounded font-bold hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Importar Emoji</span>
              </button>
            </div>
            
            <div className="grid grid-cols-8 gap-2 mb-4">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-10 h-10 text-lg hover:bg-zinc-900 rounded-xl flex items-center justify-center transition-all active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Custom Emojis sub-section */}
            <div className="border-t border-zinc-900 pt-2">
              <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block mb-2">Emojis Personalizados del Servidor</span>
              {customEmojis.length === 0 ? (
                <p className="text-[9px] text-zinc-600 font-mono italic">No hay emojis aún. ¡Importa uno arriba!</p>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {customEmojis.map((emoji) => (
                    <button
                      key={emoji.id}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + `:${emoji.name}:`);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group/emojiItem"
                      title={`:${emoji.name}:`}
                    >
                      <img src={emoji.url} alt={emoji.name} className="w-7 h-7 object-contain rounded" referrerPolicy="no-referrer" />
                      <span className="text-[7px] text-zinc-500 truncate max-w-full group-hover/emojiItem:text-amber-400">:{emoji.name}:</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM EMOJI UPLOAD MODAL OVERLAY */}
      <AnimatePresence>
        {isEmojiUploadOpen && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Importar Emoji Personalizado
                </h5>
                <button
                  type="button"
                  onClick={() => setIsEmojiUploadOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Nombre (Atajo)</label>
                  <input
                    type="text"
                    value={newEmojiName}
                    onChange={(e) => setNewEmojiName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="ej. musarana"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[8px] text-zinc-600 mt-1">Se usará escribiendo :nombre:</p>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">URL de Imagen o base64</label>
                  <input
                    type="text"
                    value={newEmojiUrl}
                    onChange={(e) => setNewEmojiUrl(e.target.value)}
                    placeholder="https://ejemplo.com/emoji.png"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!newEmojiName || !newEmojiUrl) return;
                    await addCustomEmoji(newEmojiName, newEmojiUrl, currentUser.id);
                    setIsEmojiUploadOpen(false);
                    setNewEmojiName('');
                    setNewEmojiUrl('');
                    showToast('¡Emoji personalizado agregado con éxito!');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Guardar Emoji
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview of attached image before sending */}
      {attachedImageUrl && (
        <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-900/40 flex items-center gap-3 relative z-10">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center">
            <img src={attachedImageUrl} alt="Attachment preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setAttachedImageUrl('')}
              className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-red-650 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-[9px]"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold truncate">Imagen / GIF lista para enviar</p>
            <p className="text-[9px] text-zinc-600 font-mono">Formato Media</p>
          </div>
        </div>
      )}

      {/* Paste URL Input bar */}
      {showUrlInput && (
        <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-900/40 flex items-center gap-2 relative z-10 animate-fade-in">
          <input
            type="text"
            value={attachedImageUrl}
            onChange={(e) => setAttachedImageUrl(e.target.value)}
            placeholder="Pega la URL de un GIF o Imagen..."
            className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="text-[10px] text-zinc-500 hover:text-white px-2 py-1"
          >
            Listo
          </button>
        </div>
      )}

      {/* Input Box Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900/40 flex items-center gap-2 relative z-10"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors border ${
            showEmojiPicker 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-white'
          }`}
          id="emoji-picker-btn"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Media attachment triggers */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="w-11 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            title="Subir Archivo Imagen/GIF"
          >
            <Upload className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
              showUrlInput
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-white'
            }`}
            title="Pegar URL de GIF/Imagen"
          >
            <Link className="w-4.5 h-4.5" />
          </button>
          <input
            type="file"
            ref={mediaInputRef}
            onChange={handleMediaFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Escribe un squeak o adjunta un GIF en #${squeak.name}...`}
          className="flex-1 bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder-zinc-500"
          id="chat-message-input"
        />

        <button
          type="submit"
          className="w-11 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-amber-500/10"
          id="send-message-btn"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* USER PROFILE CARD POPUP (MODAL) WITH BIO, BLOCK, REPORT, ADD FRIEND */}
      <AnimatePresence>
        {selectedUserProfile && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              id="chat-profile-card-modal"
            >
              {/* Profile Background Decorator */}
              {selectedUserProfile.coverUrl ? (
                <img 
                  src={selectedUserProfile.coverUrl} 
                  alt="Cover" 
                  className="absolute top-0 inset-x-0 h-16 w-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="absolute top-0 inset-x-0 h-16 opacity-30 animate-fade-in"
                  style={{ backgroundColor: selectedUserProfile.avatarColor }}
                />
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedUserProfile(null)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 z-10 hover:text-white cursor-pointer"
              >
                <XIcon className="w-3 h-3" />
              </button>

              <div className="flex flex-col items-center mt-4 relative z-10 text-center text-white">
                {/* Avatar with status indicator */}
                <div className="relative mb-3">
                  {selectedUserProfile.avatarUrl ? (
                    <img
                      src={selectedUserProfile.avatarUrl}
                      alt={selectedUserProfile.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-zinc-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold ring-2 ring-zinc-900"
                      style={{ backgroundColor: selectedUserProfile.avatarColor }}
                    >
                      {selectedUserProfile.avatarIcon}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950 ${
                      selectedUserProfile.status === 'online' ? 'bg-emerald-500' :
                      selectedUserProfile.status === 'idle' ? 'bg-amber-500' :
                      selectedUserProfile.status === 'dnd' ? 'bg-red-500' : 'bg-zinc-600'
                    }`} />
                  </div>
                </div>

                {/* Nickname and username */}
                <h4 className="text-sm font-black text-white flex items-center justify-center gap-1">
                  <span>{selectedUserProfile.name}</span>
                  {selectedUserProfile.id !== currentUser.id && (
                    <button
                      onClick={async () => {
                        const isFriend = currentUser.friends?.includes(selectedUserProfile.id);
                        let updatedFriends = [...(currentUser.friends || [])];
                        if (isFriend) {
                          updatedFriends = updatedFriends.filter(id => id !== selectedUserProfile.id);
                        } else {
                          updatedFriends.push(selectedUserProfile.id);
                        }
                        const updated = { ...currentUser, friends: updatedFriends };
                        if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                        else {
                          localStorage.setItem('shrew_user_profile', JSON.stringify(updated));
                          await saveUserProfileInFirestore(updated);
                        }
                        showToast(isFriend ? 'Amigo eliminado de tu lista' : '¡Amigo agregado con éxito!');
                      }}
                      className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 cursor-pointer"
                      title={currentUser.friends?.includes(selectedUserProfile.id) ? 'Quitar Amigo' : 'Agregar Amigo'}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">@{selectedUserProfile.username || selectedUserProfile.name.toLowerCase().replace(/\s+/g, '_')}</p>

                {/* BIOGRAPHY AREA */}
                <div className="w-full text-left mt-3 bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-xl">
                  <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase block mb-1">Descripción / Bio</span>
                  <p className="text-xs text-zinc-300 leading-normal break-words whitespace-pre-wrap font-medium">
                    {selectedUserProfile.bio || 'Este habitante prefiere el misterio y no ha dejado una descripción todavía.'}
                  </p>
                </div>

                {/* Status message */}
                {selectedUserProfile.statusText && (
                  <div className="mt-2.5 px-3 py-1.5 bg-zinc-900/60 rounded-xl border border-zinc-900 text-xs text-zinc-400 italic max-w-full break-words">
                    "{selectedUserProfile.statusText}"
                  </div>
                )}

                {/* Divider */}
                <div className="w-full border-b border-zinc-900/60 my-3" />

                {/* Action buttons (Report, Block) */}
                {selectedUserProfile.id !== currentUser.id && (
                  <div className="w-full grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const reportsRef = collection(db, 'reports');
                          await addDoc(reportsRef, {
                            reportedUserId: selectedUserProfile.id,
                            reportedBy: currentUser.id,
                            timestamp: Date.now(),
                            status: 'pending'
                          });
                          showToast('Usuario denunciado. Moderadores alertados.');
                        } catch (err) {
                          console.error('Error reporting user:', err);
                        }
                      }}
                      className="py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 text-[10px] font-bold border border-red-900/50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>Denunciar</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const isBlocked = currentUser.blockedUsers?.includes(selectedUserProfile.id);
                        let updatedBlocked = [...(currentUser.blockedUsers || [])];
                        if (isBlocked) {
                          updatedBlocked = updatedBlocked.filter(id => id !== selectedUserProfile.id);
                        } else {
                          updatedBlocked.push(selectedUserProfile.id);
                        }
                        const updated = { ...currentUser, blockedUsers: updatedBlocked };
                        
                        if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                        else {
                          localStorage.setItem('shrew_user_profile', JSON.stringify(updated));
                          await saveUserProfileInFirestore(updated);
                        }
                        
                        setSelectedUserProfile(null);
                        showToast(isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado correctamente');
                      }}
                      className="py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold border border-zinc-850 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{currentUser.blockedUsers?.includes(selectedUserProfile.id) ? 'Desbloquear' : 'Bloquear'}</span>
                    </button>
                  </div>
                )}

                {/* Direct Message shortcut if it is NOT the current user */}
                {selectedUserProfile.id !== currentUser.id && onStartDm && (
                  <button
                    onClick={() => {
                      setSelectedUserProfile(null);
                      onStartDm(selectedUserProfile.id);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer mb-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar Squeak Directo</span>
                  </button>
                )}

                {/* Share Profile button */}
                <button
                  onClick={() => {
                    const link = `shrw.gg/u/${selectedUserProfile.username}`;
                    navigator.clipboard.writeText(link);
                    setProfileCopied(true);
                    setTimeout(() => setProfileCopied(false), 2000);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                    profileCopied 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {profileCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{profileCopied ? '¡Enlace Copiado!' : 'Compartir Perfil'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION OVERLAY MENU FOR MESSAGES */}
      <AnimatePresence>
        {activeMenuMessage && (
          <div 
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setActiveMenuMessage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl shadow-2xl z-50 w-44 flex flex-col gap-0.5"
              style={{ 
                left: Math.min(menuCoords.x, window.innerWidth - 190), 
                top: Math.min(menuCoords.y, window.innerHeight - 180) 
              }}
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeMenuMessage.content);
                  showToast('¡Texto copiado al portapapeles!');
                  setActiveMenuMessage(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-xs text-zinc-300 font-medium flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Squeak</span>
              </button>

              <button
                onClick={() => {
                  setForwardingMessage(activeMenuMessage);
                  setActiveMenuMessage(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-xs text-zinc-300 font-medium flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Reenviar Mensaje</span>
              </button>

              {activeMenuMessage.senderId === currentUser.id && (
                <button
                  onClick={() => {
                    handleDelete(activeMenuMessage.id);
                    setActiveMenuMessage(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Squeak</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORWARD SQUEAK OVERLAY DIALOG */}
      <AnimatePresence>
        {forwardingMessage && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[80%]"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-500" />
                  Reenviar Squeak a...
                </h5>
                <button
                  type="button"
                  onClick={() => setForwardingMessage(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 text-xs text-zinc-400 mb-4 line-clamp-3 italic">
                "{forwardingMessage.content}"
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                <span className="text-[8px] font-bold text-zinc-500 tracking-wider uppercase">Canales de Nidos</span>
                {allSqueaks.length === 0 ? (
                  <p className="text-[9px] text-zinc-600 italic">No hay otros canales cargados</p>
                ) : (
                  allSqueaks.map(sq => {
                    const nest = allNests.find(n => n.id === sq.nestId);
                    return (
                      <button
                        key={sq.id}
                        onClick={async () => {
                          await sendSqueakMessage(
                            sq.nestId,
                            sq.id,
                            currentUser.id,
                            currentUser.name,
                            currentUser.avatarColor,
                            currentUser.avatarUrl || currentUser.avatarIcon,
                            `[Reenviado] ${forwardingMessage.content}`,
                            forwardingMessage.imageUrl
                          );
                          setForwardingMessage(null);
                          showToast(`Mensaje reenviado a #${sq.name}`);
                        }}
                        className="w-full text-left p-2 hover:bg-zinc-900 rounded-lg flex items-center justify-between group transition-colors cursor-pointer border border-zinc-950 hover:border-zinc-850"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">#</span>
                          <span className="text-xs text-zinc-200 group-hover:text-amber-400 font-bold">{sq.name}</span>
                          {nest && (
                            <span className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 rounded">({nest.name})</span>
                          )}
                        </div>
                        <Send className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })
                )}

                <div className="border-t border-zinc-900 my-2 pt-2" />
                <span className="text-[8px] font-bold text-zinc-500 tracking-wider uppercase">Usuarios Amigos (DM)</span>
                
                {allUsers.filter(u => u.id !== currentUser.id && currentUser.friends?.includes(u.id)).length === 0 ? (
                  <p className="text-[9px] text-zinc-600 italic">No tienes amigos conectados para reenviar por DM</p>
                ) : (
                  allUsers.filter(u => u.id !== currentUser.id && currentUser.friends?.includes(u.id)).map(friend => (
                    <button
                      key={friend.id}
                      onClick={async () => {
                        if (onStartDm) {
                          onStartDm(friend.id);
                          setForwardingMessage(null);
                          showToast(`Inicia conversación de DM para reenviar`);
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-zinc-900 rounded-lg flex items-center justify-between group transition-colors cursor-pointer border border-zinc-950 hover:border-zinc-850"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{friend.avatarIcon}</span>
                        <span className="text-xs text-zinc-200 font-bold group-hover:text-amber-400">{friend.name}</span>
                      </div>
                      <Send className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOAT OVERLAY CONFIRMATION TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-zinc-950/90 backdrop-blur border border-zinc-800 text-white font-mono text-[10px] font-bold px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 select-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Modal Overlay */}
      <AnimatePresence>
        {activeImageUrl && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col" id="zoomed-image-modal">
            {/* Top Toolbar */}
            <div className="h-14 px-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between text-white select-none">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Visor de Imagen</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyImage(activeImageUrl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    imageCopied 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>{imageCopied ? '¡Copiado!' : 'Copiar Imagen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveImage(activeImageUrl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    imageSaved 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <Download className="w-3 h-3" />
                  <span>{imageSaved ? '¡Guardado!' : 'Guardar Imagen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageUrl(null)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Central Area for Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                src={activeImageUrl}
                alt="Zoomed attachment"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

