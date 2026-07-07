import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DmChannel, DmMessage } from '../types';
import { 
  listenToDmChannels, 
  listenToDmMessages, 
  sendDmMessage, 
  getOrCreateDmChannel, 
  listenToAllUsers,
  deleteDmMessage,
  saveUserProfileInFirestore,
  db
} from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MessageSquare, Send, User, AtSign, ArrowLeft, Plus, Sparkles, MessageCircle, Info, Upload, Link, X, Share2, Copy, Check, Download, MoreVertical, Trash2, ShieldAlert, UserPlus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DmPanelProps {
  currentUser: UserProfile;
  initialActiveUserId?: string | null;
  onClearInitialActiveUserId?: () => void;
  onUpdateCurrentUser?: (updated: UserProfile) => void;
}

export const DmPanel: React.FC<DmPanelProps> = ({ 
  currentUser,
  initialActiveUserId,
  onClearInitialActiveUserId,
  onUpdateCurrentUser
}) => {
  const [channels, setChannels] = useState<DmChannel[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [activeChannelMessages, setActiveChannelMessages] = useState<DmMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  
  // Custom states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuMessage, setActiveMenuMessage] = useState<DmMessage | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [toastMessage, setToastMessage] = useState('');
  
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto trigger chat if routed with a specific user
  useEffect(() => {
    if (initialActiveUserId) {
      startConversationWithUser(initialActiveUserId);
      if (onClearInitialActiveUserId) {
        onClearInitialActiveUserId();
      }
    }
  }, [initialActiveUserId]);

  // 1. Fetch DM channels for the current user
  useEffect(() => {
    const unsubscribe = listenToDmChannels(currentUser.id, (loadedChannels) => {
      setChannels(loadedChannels);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  // 2. Fetch all users to resolve participant information
  const [customEmojis, setCustomEmojis] = useState<any[]>([]);
  useEffect(() => {
    const unsubscribeAllUsers = listenToAllUsers((loadedUsers) => {
      // Filter out current user from browsing lists, but keep in complete array for resolve helpers
      setAllUsers(loadedUsers);
    });
    
    // Subscribe to custom emojis in real time
    const unsubscribeCustomEmojis = listenToCustomEmojis((emojis) => {
      setCustomEmojis(emojis);
    });

    return () => {
      unsubscribeAllUsers();
      unsubscribeCustomEmojis();
    };
  }, []);

  // 3. Fetch messages for the active DM channel
  useEffect(() => {
    if (!activeChannelId) {
      setActiveChannelMessages([]);
      return;
    }
    const unsubscribe = listenToDmMessages(activeChannelId, (messages) => {
      setActiveChannelMessages(messages);
    });
    return () => unsubscribe();
  }, [activeChannelId]);

  // 4. Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !attachedImageUrl) return;

    setInputText('');
    setAttachedImageUrl('');
    setShowUrlInput(false);
    try {
      await sendDmMessage(
        activeChannelId,
        currentUser.id,
        currentUser.name,
        currentUser.avatarUrl || currentUser.avatarIcon,
        currentUser.avatarColor,
        text,
        attachedImageUrl || undefined
      );
    } catch (error) {
      console.error('Error sending DM:', error);
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

  const startConversationWithUser = async (otherUserId: string) => {
    try {
      const channelId = await getOrCreateDmChannel(currentUser.id, otherUserId);
      setActiveChannelId(channelId);
      setIsNewChatOpen(false);
      setSelectedUserProfile(null);
    } catch (error) {
      console.error('Error creating/opening DM:', error);
    }
  };

  // Helper: Find the other participant in a DM channel
  const getOtherParticipant = (channel: DmChannel): UserProfile | undefined => {
    const otherId = channel.participants.find(p => p !== currentUser.id);
    return allUsers.find(u => u.id === otherId);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activePartner = activeChannel ? getOtherParticipant(activeChannel) : undefined;

  // Render status badge helper
  const renderStatusDot = (status: string) => {
    switch (status) {
      case 'online': return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />;
      case 'idle': return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-zinc-950" />;
      case 'dnd': return <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-zinc-950" />;
      default: return <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 ring-2 ring-zinc-950" />;
    }
  };

  // Touch and click handlers for floating DM message actions list
  const handleTouchStart = (msg: DmMessage, e: React.TouchEvent) => {
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

  const handleContextMenu = (msg: DmMessage, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenuMessage(msg);
    setMenuCoords({ x: e.clientX, y: e.clientY - 20 });
  };

  const handleDeleteDmMessage = async (messageId: string) => {
    try {
      await deleteDmMessage(messageId);
      showToast('Mensaje privado borrado');
    } catch (err) {
      console.error('Error deleting DM message:', err);
    }
  };

  const renderContentWithEmojis = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(:[a-z0-9_]+:)/g);
    return (
      <span className="inline-wrap break-words">
        {parts.map((part, idx) => {
          if (part.startsWith(':') && part.endsWith(':')) {
            const emojiName = part.slice(1, -1);
            const foundEmoji = customEmojis.find(e => e.name.toLowerCase() === emojiName.toLowerCase());
            if (foundEmoji) {
              return (
                <img
                  key={idx}
                  src={foundEmoji.url}
                  alt={emojiName}
                  className="inline-block w-5.5 h-5.5 object-contain mx-0.5 align-middle select-none"
                  title={`:${emojiName}:`}
                />
              );
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative h-full" id="dm-panel-root">
      
      {/* 1. CHAT CHANNELS LISTING VIEW */}
      {!activeChannelId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-900/30 border-b border-zinc-900/40 flex items-center justify-between z-10">
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-white tracking-wider flex items-center gap-1.5 uppercase">
                <span className="text-purple-500">»</span> Mensajes Directos
              </h2>
              <p className="text-[10px] text-zinc-500 font-medium">Conversaciones privadas con musarañas</p>
            </div>
            
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-md active:scale-95"
              title="Iniciar Nueva Conversación"
              id="new-dm-btn"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Channels list scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none">
            {channels.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900/60 border border-zinc-900 flex items-center justify-center text-2xl mb-4 text-purple-400 shadow-md">
                  📨
                </div>
                <h3 className="text-sm font-bold text-zinc-300">Silencio en el canal...</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">
                  No has iniciado chats privados. ¡Toca el botón + de arriba para buscar amigos!
                </p>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/10 active:scale-95"
                >
                  Iniciar Conversación
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  CHATS ACTIVOS ({channels.length})
                </span>
                {channels.map((chan) => {
                  const partner = getOtherParticipant(chan);
                  if (!partner) return null;

                  return (
                    <button
                      key={chan.id}
                      onClick={() => setActiveChannelId(chan.id)}
                      className="w-full flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/80 rounded-2xl text-left transition-all group active:scale-[0.99]"
                      id={`dm-channel-btn-${chan.id}`}
                    >
                      {/* Avatar with live status */}
                      <div className="relative flex-shrink-0">
                        {partner.avatarUrl ? (
                          <img
                            src={partner.avatarUrl}
                            alt={partner.name}
                            className="w-11 h-11 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${partner.avatarColor}20`, color: partner.avatarColor }}
                          >
                            {partner.avatarIcon}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1">
                          {renderStatusDot(partner.status)}
                        </div>
                      </div>

                      {/* Info preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                            {partner.name}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            @{partner.username}
                          </span>
                        </div>
                        {partner.statusText && (
                          <div className="text-[9px] text-zinc-400 italic font-medium truncate mt-0.5">
                            "{partner.statusText}"
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-500 truncate mt-1">
                          {chan.lastMessageText || 'Conversación vacía'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 2. CHAT FEED WITH ACTIVE USER */}
          {/* Active Partner Header */}
          <div className="px-3 py-3.5 bg-zinc-900/30 border-b border-zinc-900/40 flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setActiveChannelId('')}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {activePartner && (
                <button
                  onClick={() => setSelectedUserProfile(activePartner)}
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-all min-w-0"
                  title="Ver perfil completo"
                  id="view-partner-profile-header-btn"
                >
                  <div className="relative">
                    {activePartner.avatarUrl ? (
                      <img
                        src={activePartner.avatarUrl}
                        alt={activePartner.name}
                        className="w-8 h-8 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${activePartner.avatarColor}20`, color: activePartner.avatarColor }}
                      >
                        {activePartner.avatarIcon}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 scale-75">
                      {renderStatusDot(activePartner.status)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {activePartner.name}
                      <span className="text-[9px] font-mono text-zinc-500 font-normal">@{activePartner.username}</span>
                    </h3>
                    <p className="text-[8px] text-zinc-500 truncate max-w-[150px]">
                      {activePartner.statusText ? `"${activePartner.statusText}"` : 'Ver detalles del perfil'}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {activePartner && (
              <button
                onClick={() => setSelectedUserProfile(activePartner)}
                className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
                title="Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dm messages stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
            {activeChannelMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-3 animate-bounce">
                  🔑
                </div>
                <h4 className="text-xs font-bold text-zinc-300">Túnel Privado Seguro</h4>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">
                  Los mensajes enviados en este túnel son directos y privados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeChannelMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isBlocked = currentUser.blockedUsers?.includes(msg.senderId);
                  
                  if (isBlocked) {
                    return (
                      <div 
                        key={msg.id} 
                        className="flex gap-2.5 max-w-[85%] mr-auto items-center p-2.5 bg-zinc-900/10 border border-zinc-900/60 rounded-xl text-[10px] text-zinc-600 italic select-none"
                      >
                        🚫 Squeak ocultado de usuario bloqueado
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'} group/msg relative`}
                      onContextMenu={(e) => handleContextMenu(msg, e)}
                      onTouchStart={(e) => handleTouchStart(msg, e)}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Avatar */}
                      <button
                        onClick={() => {
                          const lookup = allUsers.find(u => u.id === msg.senderId);
                          if (lookup) setSelectedUserProfile(lookup);
                        }}
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base border border-zinc-900 overflow-hidden"
                        style={{ backgroundColor: `${msg.senderColor}18` }}
                      >
                        {msg.senderAvatar?.startsWith('data:') || msg.senderAvatar?.startsWith('http') ? (
                          <img src={msg.senderAvatar} alt="Sender" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          msg.senderAvatar
                        )}
                      </button>

                      {/* Content Bubble */}
                      <div className="space-y-1 relative">
                        <div className={`flex items-center gap-1.5 text-[9px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-bold text-zinc-400 animate-fade-in" style={{ color: isMe ? undefined : msg.senderColor }}>
                            {isMe ? 'Tú' : msg.senderName}
                          </span>
                          <span className="text-zinc-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`px-3.5 py-2 rounded-xl text-xs leading-relaxed break-words border relative group ${
                            isMe
                              ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none'
                              : 'bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tl-none'
                          }`}
                        >
                          {msg.content && <p>{renderContentWithEmojis(msg.content)}</p>}

                          {msg.imageUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-black/15 max-w-full max-h-56 bg-black/20 flex items-center justify-center">
                              <img 
                                src={msg.imageUrl} 
                                alt="Direct Message media" 
                                className="max-w-full max-h-56 object-contain rounded-lg hover:scale-[1.01] transition-transform cursor-pointer" 
                                referrerPolicy="no-referrer" 
                                onClick={() => setActiveImageUrl(msg.imageUrl || null)}
                              />
                            </div>
                          )}

                          {/* Quick Action Trigger Button for non-touch cursor mouse users */}
                          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 z-10 ${
                            isMe ? '-left-10' : '-right-10'
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMessage(msg);
                                setMenuCoords({ x: e.clientX, y: e.clientY - 10 });
                              }}
                              className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview of attached image before sending */}
          {attachedImageUrl && (
            <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900/40 flex items-center gap-3 z-10">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center">
                <img src={attachedImageUrl} alt="DM attachment preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImageUrl('')}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-650 rounded-full flex items-center justify-center text-white text-[9px]"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400 font-bold truncate">Imagen DM lista para enviar</p>
                <p className="text-[9px] text-zinc-600 font-mono">Privado</p>
              </div>
            </div>
          )}

          {/* Paste URL Input bar */}
          {showUrlInput && (
            <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900/40 flex items-center gap-2 z-10 animate-fade-in">
              <input
                type="text"
                value={attachedImageUrl}
                onChange={(e) => setAttachedImageUrl(e.target.value)}
                placeholder="Pega la URL de un GIF o Imagen..."
                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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

          {/* DM Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-zinc-950 border-t border-zinc-900/40 flex items-center gap-2 z-10"
          >
            {/* Media triggers */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Adjuntar Imagen/GIF"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                  showUrlInput
                    ? 'bg-purple-950/40 border-purple-800 text-purple-400'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-white'
                }`}
                title="Pegar URL de Imagen/GIF"
              >
                <Link className="w-4 h-4" />
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
              placeholder={activePartner ? `Escribe un mensaje privado a @${activePartner.username}...` : 'Escribe un mensaje...'}
              className="flex-1 bg-zinc-900 border border-zinc-950 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all placeholder-zinc-500"
              id="dm-message-input"
            />
            <button
              type="submit"
              className="w-9 h-9 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-md shadow-purple-500/10"
              id="send-dm-btn"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 3. NEW DM DIALOG OVERLAY */}
      <AnimatePresence>
        {isNewChatOpen && (
          <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-900 rounded-3xl p-5 flex flex-col max-h-[75vh] shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nueva Conversación</h4>
                </div>
                <button
                  onClick={() => setIsNewChatOpen(false)}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              {/* Users search input */}
              <div className="relative mb-3.5 flex-shrink-0">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escribe el nombre de usuario..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all"
                  id="friend-search-input"
                />
              </div>

              {/* Users search/list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {allUsers.filter(u => u.id !== currentUser.id).length === 0 ? (
                  <p className="text-center text-xs text-zinc-600 py-6 italic">No hay otros usuarios registrados en el nido</p>
                ) : (() => {
                  const filtered = allUsers
                    .filter(u => u.id !== currentUser.id)
                    .filter(u => {
                      const query = searchQuery.toLowerCase();
                      return u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
                    });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <p className="text-xs text-zinc-600 italic">No se encontró ninguna musaraña</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Intenta con otro apodo o @nombre</p>
                      </div>
                    );
                  }

                  return filtered.map((usr) => {
                    const isFriend = currentUser.friends?.includes(usr.id);

                    const handleAddFriendAction = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      try {
                        const updatedFriends = [...(currentUser.friends || [])];
                        if (!updatedFriends.includes(usr.id)) {
                          updatedFriends.push(usr.id);
                        }
                        const updated = {
                          ...currentUser,
                          friends: updatedFriends
                        };
                        await saveUserProfileInFirestore(updated);
                        if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                        showToast(`Agregado @${usr.username} a amigos`);
                      } catch (err) {
                        console.error('Error adding friend:', err);
                      }
                    };

                    return (
                      <div
                        key={usr.id}
                        className="w-full flex items-center justify-between gap-2 p-2 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900/60 rounded-xl text-left transition-all"
                      >
                        <button
                          onClick={() => startConversationWithUser(usr.id)}
                          className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
                        >
                          {/* User custom photo or emoji icon */}
                          {usr.avatarUrl ? (
                            <img src={usr.avatarUrl} alt={usr.name} className="w-9 h-9 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                              style={{ backgroundColor: `${usr.avatarColor}20`, color: usr.avatarColor }}
                            >
                              {usr.avatarIcon}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-200 truncate">{usr.name}</span>
                              <span className="text-[9px] font-mono text-zinc-500">@{usr.username}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[8px] text-zinc-500 truncate max-w-[120px]">
                                {usr.statusText ? `"${usr.statusText}"` : 'Sin estado'}
                              </span>
                              <div className="scale-75">
                                {renderStatusDot(usr.status)}
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="flex-shrink-0 pr-1">
                          {isFriend ? (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-950/40 px-2 py-1 rounded-lg">
                              Amigo
                            </span>
                          ) : (
                            <button
                              onClick={handleAddFriendAction}
                              className="bg-purple-650 hover:bg-purple-500 text-white p-1.5 rounded-lg transition-all"
                              title="Agregar Amigo"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. USER PROFILE CARD VIEW POPUP (MODAL) */}
      <AnimatePresence>
        {selectedUserProfile && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              id="modal-profile-card"
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
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 z-10 hover:text-white"
              >
                <XIcon className="w-3 h-3" />
              </button>

              <div className="flex flex-col items-center mt-4 relative z-10 text-center">
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
                    {renderStatusDot(selectedUserProfile.status)}
                  </div>
                </div>

                {/* Nickname and username */}
                <h4 className="text-sm font-black text-white">{selectedUserProfile.name}</h4>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">@{selectedUserProfile.username}</p>

                {/* Biography */}
                <div className="w-full mt-3.5 text-left bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900/60">
                  <span className="text-[9px] font-bold text-zinc-500 block mb-1 uppercase tracking-wider">Acerca de mí</span>
                  <p className="text-[10.5px] text-zinc-300 leading-relaxed font-medium">
                    {selectedUserProfile.bio || 'Esta musaraña mantiene un perfil misterioso... 🤫'}
                  </p>
                </div>

                {/* Status message */}
                {selectedUserProfile.statusText && (
                  <div className="mt-2 w-full text-left px-2.5 py-1.5 bg-purple-950/25 rounded-lg border border-purple-900/40 text-[10px] text-purple-300 italic">
                    "{selectedUserProfile.statusText}"
                  </div>
                )}

                {/* Divider */}
                <div className="w-full border-b border-zinc-900/60 my-3.5" />

                <div className="w-full flex flex-col gap-1 text-left text-[9px] text-zinc-500 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Alineación:</span>
                    <span className="font-semibold text-zinc-400 capitalize">{selectedUserProfile.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Túnel Unido:</span>
                    <span className="font-mono">
                      {new Date(selectedUserProfile.joinedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions Grid */}
                {selectedUserProfile.id !== currentUser.id && (
                  <div className="w-full grid grid-cols-2 gap-2 mb-3">
                    {/* Add/Remove Friend */}
                    <button
                      onClick={async () => {
                        const isFriend = currentUser.friends?.includes(selectedUserProfile.id);
                        const updatedFriends = isFriend
                          ? (currentUser.friends || []).filter(id => id !== selectedUserProfile.id)
                          : [...(currentUser.friends || []), selectedUserProfile.id];
                        
                        const updated = {
                          ...currentUser,
                          friends: updatedFriends
                        };
                        try {
                          await saveUserProfileInFirestore(updated);
                          if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                          showToast(isFriend ? 'Eliminado de amigos' : '¡Amigo agregado!');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        currentUser.friends?.includes(selectedUserProfile.id)
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-805'
                          : 'bg-purple-650 hover:bg-purple-550 text-white shadow-md shadow-purple-500/10'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{currentUser.friends?.includes(selectedUserProfile.id) ? 'Quitar Amigo' : 'Añadir Amigo'}</span>
                    </button>

                    {/* Block/Unblock */}
                    <button
                      onClick={async () => {
                        const isBlocked = currentUser.blockedUsers?.includes(selectedUserProfile.id);
                        const updatedBlocked = isBlocked
                          ? (currentUser.blockedUsers || []).filter(id => id !== selectedUserProfile.id)
                          : [...(currentUser.blockedUsers || []), selectedUserProfile.id];
                        
                        const updated = {
                          ...currentUser,
                          blockedUsers: updatedBlocked
                        };
                        try {
                          await saveUserProfileInFirestore(updated);
                          if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
                          showToast(isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
                          setSelectedUserProfile(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        currentUser.blockedUsers?.includes(selectedUserProfile.id)
                          ? 'bg-emerald-950/30 border border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/50'
                          : 'bg-red-950/30 border border-red-900/60 text-red-400 hover:bg-red-950/50'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>{currentUser.blockedUsers?.includes(selectedUserProfile.id) ? 'Desbloquear' : 'Bloquear'}</span>
                    </button>
                  </div>
                )}

                {/* Report User button */}
                {selectedUserProfile.id !== currentUser.id && (
                  <button
                    onClick={async () => {
                      try {
                        await addDoc(collection(db, 'reports'), {
                          reportedId: selectedUserProfile.id,
                          reportedName: selectedUserProfile.name,
                          reporterId: currentUser.id,
                          reporterName: currentUser.name,
                          timestamp: Date.now()
                        });
                        showToast('Denuncia registrada con éxito');
                      } catch (err) {
                        showToast('Error al procesar denuncia');
                      }
                    }}
                    className="w-full bg-zinc-900/60 border border-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 py-1.5 rounded-xl text-[9px] font-bold transition-all flex items-center justify-center gap-1 mb-2.5"
                  >
                    🚩 Denunciar Musaraña
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
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer mb-2 ${
                    profileCopied 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {profileCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{profileCopied ? '¡Enlace Copiado!' : 'Compartir Perfil'}</span>
                </button>

                {/* Direct Message shortcut if it is NOT the current user */}
                {selectedUserProfile.id !== currentUser.id && (
                  <button
                    onClick={() => startConversationWithUser(selectedUserProfile.id)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar Squeak Directo</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Modal Overlay */}
      <AnimatePresence>
        {activeImageUrl && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col" id="dm-zoomed-image-modal">
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
                alt="Zoomed DM attachment"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Menu overlay */}
      {activeMenuMessage && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          onClick={() => setActiveMenuMessage(null)}
        >
          <div 
            className="absolute bg-zinc-950 border border-zinc-900 rounded-2xl py-1.5 px-1 shadow-2xl w-44 animate-fade-in"
            style={{ 
              top: `${Math.min(window.innerHeight - 150, Math.max(10, menuCoords.y))}px`, 
              left: `${Math.min(window.innerWidth - 190, Math.max(10, menuCoords.x))}px` 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeMenuMessage.content || '');
                showToast('Mensaje copiado');
                setActiveMenuMessage(null);
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-xl transition-all flex items-center gap-2 font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copiar Mensaje</span>
            </button>
            
            {activeMenuMessage.senderId === currentUser.id && (
              <button
                onClick={() => {
                  handleDeleteDmMessage(activeMenuMessage.id);
                  setActiveMenuMessage(null);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 rounded-xl transition-all flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Mensaje</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-purple-400 text-[11px] font-black tracking-wider uppercase px-4 py-2 rounded-2xl shadow-xl z-50 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal minimal Close SVG representation for quick import bypass
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
