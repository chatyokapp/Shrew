import { useState, useEffect } from 'react';
import { UserProfile, Nest, Squeak, Message } from './types';
import { 
  seedDatabaseIfEmpty, 
  seedUsersIfEmpty,
  saveUserProfileInFirestore,
  listenToNests, 
  listenToSqueaks, 
  listenToMessages, 
  createNest, 
  createSqueak,
  ensureAnunciosChannelExists,
  ensureDefaultRolesExist,
  updateNest,
  listenToAllUsers,
  logoutUser
} from './firebase';
import { ShrewLogo } from './components/ShrewLogo';
import { UserProfileSetup } from './components/UserProfile';
import { NestSelector } from './components/NestSelector';
import { SqueakSelector } from './components/SqueakSelector';
import { ChatPanel } from './components/ChatPanel';
import { DmPanel } from './components/DmPanel';
import { EchoLounge } from './components/EchoLounge';
import { CreateNestDialog, CreateSqueakDialog } from './components/CreateDialogs';
import { EditNestDialog, ManageRolesDialog, ShareCommunityDialog } from './components/CommunityDialogs';
import { SettingsPanel, WALLPAPERS } from './components/SettingsPanel';
import { 
  Menu, 
  User, 
  Wifi, 
  Battery, 
  Edit3, 
  Plus, 
  Volume2, 
  LogOut, 
  HelpCircle,
  Sparkles,
  X,
  Settings,
  Compass,
  Zap,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [nests, setNests] = useState<Nest[]>([]);
  const [activeNestId, setActiveNestId] = useState<string>('');
  const [squeaks, setSqueaks] = useState<Squeak[]>([]);
  const [activeSqueakId, setActiveSqueakId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);

  // UI state managers
  const [isSqueaksOpen, setIsSqueaksOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateNestOpen, setIsCreateNestOpen] = useState(false);
  const [isCreateSqueakOpen, setIsCreateSqueakOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // New Community states
  const [isEditNestOpen, setIsEditNestOpen] = useState(false);
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [isShareNestOpen, setIsShareNestOpen] = useState(false);

  // Teleporter state
  const [isTeleporterOpen, setIsTeleporterOpen] = useState(false);
  const [teleportLink, setTeleportLink] = useState('');
  const [teleportError, setTeleportError] = useState('');

  // All users registered
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // PWA & Notification States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [showAppUpdateBanner, setShowAppUpdateBanner] = useState<boolean>(false);
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });

  // App settings state
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('shrew_language') || 'es';
  });
  const [currentWallpaper, setCurrentWallpaper] = useState<string>(() => {
    return localStorage.getItem('shrew_wallpaper') || 'dark-default';
  });
  const [currentAccentColor, setCurrentAccentColor] = useState<string>(() => {
    return localStorage.getItem('shrew_accent_color') || '#f59e0b';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shrew_sound_enabled') !== 'false';
  });

  // Clock state for mock status bar
  const [time, setTime] = useState<string>('');

  // 1. Initial configuration & Profile recovery
  useEffect(() => {
    // Clock tick
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 60000);

    // Retrieve user profile from local storage
    const stored = localStorage.getItem('shrew_user_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setCurrentUser(profile);
        saveUserProfileInFirestore(profile);
      } catch (err) {
        console.error('Error parsing stored profile:', err);
      }
    }

    // Seed database if it is the first launch
    seedDatabaseIfEmpty().then(() => {
      ensureAnunciosChannelExists();
      ensureDefaultRolesExist();
    });
    seedUsersIfEmpty();

    return () => clearInterval(clockInterval);
  }, []);

  // PWA and Auto-update event listener setup
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppUpdate = () => {
      setShowAppUpdateBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('shrew-app-update', handleAppUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('shrew-app-update', handleAppUpdate);
    };
  }, []);

  // Real-time listener for all users
  useEffect(() => {
    const unsubscribe = listenToAllUsers((loadedUsers) => {
      setAllUsers(loadedUsers);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Nests listener
  useEffect(() => {
    const unsubscribe = listenToNests((loadedNests) => {
      setNests(loadedNests);
      if (loadedNests.length > 0 && !activeNestId) {
        // Default to the global community
        const global = loadedNests.find(n => n.id === 'nest-global') || loadedNests[0];
        setActiveNestId(global.id);
      }
    });
    return () => unsubscribe();
  }, [activeNestId]);

  // 3. Real-time Squeaks (Channels) listener
  useEffect(() => {
    if (!activeNestId || activeNestId === 'dms') return;

    const unsubscribe = listenToSqueaks(activeNestId, (loadedSqueaks) => {
      setSqueaks(loadedSqueaks);
      if (loadedSqueaks.length > 0) {
        // Auto-select first channel of the new nest
        setActiveSqueakId(loadedSqueaks[0].id);
      } else {
        setActiveSqueakId('');
      }
    });
    return () => unsubscribe();
  }, [activeNestId]);

  // 4. Real-time Messages listener
  useEffect(() => {
    if (!activeSqueakId) {
      setMessages([]);
      return;
    }

    const currentSqueak = squeaks.find(s => s.id === activeSqueakId);
    if (!currentSqueak || currentSqueak.type !== 'text') {
      setMessages([]);
      return;
    }

    const unsubscribe = listenToMessages(activeSqueakId, (loadedMessages) => {
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [activeSqueakId, squeaks]);

  // Trigger desktop browser notifications on new message
  useEffect(() => {
    if (messages.length === 0 || !currentUser) return;
    const lastMsg = messages[messages.length - 1];
    
    // Only notify if author is NOT the current user AND window is not focused
    if (lastMsg.senderId !== currentUser.id) {
      const isWindowFocused = document.hasFocus();
      if (!isWindowFocused) {
        // Trigger browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const authorName = lastMsg.senderName || 'Musaraña';
          new Notification(`Nuevo mensaje de @${authorName}`, {
            body: lastMsg.text,
            icon: '/shrew_icon.jpg',
            tag: lastMsg.id, // prevents duplicates
            badge: '/shrew_icon.jpg',
          });
        }
      }
    }
  }, [messages, currentUser]);

  // Handle Profile Save
  const handleSaveProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem('shrew_user_profile', JSON.stringify(profile));
    saveUserProfileInFirestore(profile);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
  };

  // Direct messaging action trigger
  const handleStartDm = (userId: string) => {
    setActiveDmUserId(userId);
    setActiveNestId('dms');
  };

  // Handle Logout (reset local shrew profile)
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Firebase Auth logout failed or was not active:', e);
    }
    localStorage.removeItem('shrew_user_profile');
    setCurrentUser(null);
    setIsSettingsOpen(false);
  };

  // Handle PWA Installation
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Handle Notifications request permission
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsAllowed(permission === 'granted');
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('shrew_language', lang);
  };

  const handleWallpaperChange = (wp: string) => {
    setCurrentWallpaper(wp);
    localStorage.setItem('shrew_wallpaper', wp);
  };

  const handleAccentColorChange = (color: string) => {
    setCurrentAccentColor(color);
    localStorage.setItem('shrew_accent_color', color);
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('shrew_sound_enabled', String(enabled));
  };

  // Create new nest helper
  const handleCreateNest = async (name: string, icon: string, color: string, description: string) => {
    if (!currentUser) return;
    try {
      const newId = await createNest(name, icon, color, description, currentUser.id);
      setActiveNestId(newId);
    } catch (error) {
      console.error('Error creating nest:', error);
    }
  };

  // Create new squeak helper
  const handleCreateSqueak = async (name: string, type: 'text' | 'voice', description: string) => {
    if (!activeNestId) return;
    try {
      const newId = await createSqueak(activeNestId, name, type, description);
      setActiveSqueakId(newId);
    } catch (error) {
      console.error('Error creating squeak:', error);
    }
  };

  const handleTeleport = (link: string) => {
    const cleanLink = link.trim().toLowerCase();
    
    // 1. Nest/Community link
    const nestMatch = cleanLink.match(/shrw\.gg\/n\/([a-zA-Z0-9_\-]+)/) || cleanLink.match(/n\/([a-zA-Z0-9_\-]+)/);
    if (nestMatch) {
      const targetNestId = nestMatch[1];
      const foundNest = nests.find(n => 
        n.id.toLowerCase() === targetNestId || 
        (n.inviteCode && n.inviteCode.toLowerCase() === targetNestId)
      );
      if (foundNest) {
        setActiveNestId(foundNest.id);
        setIsTeleporterOpen(false);
        setTeleportError('');
      } else {
        setTeleportError(currentLanguage === 'es' ? '¡Nido no encontrado en las profundidades!' : 'Nest not found deep in the tunnels!');
      }
      return;
    }

    // 2. User/Profile link
    const userMatch = cleanLink.match(/shrw\.gg\/u\/([a-zA-Z0-9_\-]+)/) || cleanLink.match(/u\/([a-zA-Z0-9_\-]+)/);
    if (userMatch) {
      const username = userMatch[1];
      const foundUser = allUsers.find(u => u.username.toLowerCase() === username);
      if (foundUser) {
        handleStartDm(foundUser.id);
        setIsTeleporterOpen(false);
        setTeleportError('');
      } else {
        setTeleportError(currentLanguage === 'es' ? '¡Musaraña no encontrada en este túnel!' : 'Shrew user not found in this burrow!');
      }
      return;
    }

    setTeleportError(currentLanguage === 'es' 
      ? 'Formato inválido. Usa shrw.gg/n/id o shrw.gg/u/username' 
      : 'Invalid format. Use shrw.gg/n/id or shrw.gg/u/username');
  };

  const activeNest = nests.find(n => n.id === activeNestId);
  const activeSqueak = squeaks.find(s => s.id === activeSqueakId);
  const activeWallpaperObj = WALLPAPERS.find(w => w.id === currentWallpaper) || WALLPAPERS[0];

  // Splash or Setup screen if profile does not exist
  if (!currentUser) {
    return (
      <div 
        className="w-full min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden select-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1e24 0%, #09090b 100%)'
        }}
        id="splash-screen"
      >
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px]" />
        <UserProfileSetup profile={null} onSave={handleSaveProfile} />
      </div>
    );
  }

  return (
    <div 
      className="w-full min-h-screen bg-zinc-950 flex items-center justify-center py-4 px-2 sm:px-6 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 120%, #18181b 0%, #020202 100%)'
      }}
      id="main-applet"
    >
      {/* Dynamic light background orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ANDROID DEVICE FRAME WRAPPER */}
      <div 
        className="w-full max-w-[420px] h-[840px] max-h-[92vh] bg-zinc-950 border-[6px] border-zinc-800 rounded-[48px] shadow-2xl flex flex-col overflow-hidden relative"
        style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)' }}
        id="android-device-container"
      >
        {/* Android Punch Hole Camera */}
        <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center border border-zinc-900/60">
          <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-800/80 mr-auto ml-3" />
        </div>

        {/* Dynamic Android Status Bar */}
        <div className="bg-zinc-950 h-10 px-6 flex items-center justify-between text-zinc-400 text-xs font-mono select-none z-40 border-b border-zinc-900/10">
          <span>{time}</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-amber-500/90 tracking-wide font-sans">Shrew-Net 5G</span>
            <Wifi className="w-3.5 h-3.5 text-zinc-400" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">98%</span>
              <Battery className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* App Shell Header */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3.5 flex items-center justify-between select-none z-30">
          <div className="flex items-center gap-3">
            {activeNestId !== 'dms' ? (
              <button
                onClick={() => setIsSqueaksOpen(true)}
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative border border-zinc-900"
                id="toggle-channels-btn"
              >
                <Menu className="w-5 h-5" />
                {/* Notification bubble if no channel selected or active changes */}
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 font-bold">
                💬
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-black border border-zinc-900 p-0.5">
                <ShrewLogo size={32} withBackground={false} />
              </div>
              <div>
                <h1 className="text-sm font-black font-sans text-white tracking-widest uppercase">
                  {activeNestId === 'dms' ? 'Túnel DM' : 'Shrew'}
                </h1>
                <div className="text-[9px] font-mono font-bold text-amber-500 flex items-center gap-1">
                  {activeNestId === 'dms' ? (
                    <>
                      <Sparkles className="w-2.5 h-2.5 animate-pulse text-purple-400" />
                      <span className="text-purple-400">CHAT PRIVADO</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      <span>NIDOS SUBTERRÁNEOS</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Teleporter Button */}
            <button
              onClick={() => {
                setIsTeleporterOpen(true);
                setTeleportError('');
                setTeleportLink('');
              }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 hover:from-amber-950/20 hover:to-amber-900/10 flex items-center justify-center text-amber-500 hover:text-amber-400 transition-all border border-amber-500/10 hover:border-amber-500/30 cursor-pointer"
              title={currentLanguage === 'es' ? 'Teletransportador' : 'Teleporter'}
            >
              <Compass className="w-4.5 h-4.5" />
            </button>

            {/* Help Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-900 cursor-pointer"
              title={currentLanguage === 'es' ? 'Manual de Musaraña' : 'Shrew Manual'}
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-900"
              title={currentLanguage === 'es' ? 'Ajustes de Shrew' : 'Shrew Settings'}
              id="open-settings-btn"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* Profile Config Trigger */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 transition-all border border-zinc-900 hover:scale-105"
              style={{ backgroundColor: `${currentUser.avatarColor}22` }}
              title={currentLanguage === 'es' ? 'Personalizar Perfil' : 'Customize Profile'}
              id="edit-profile-btn"
            >
              <span className="text-lg">{currentUser.avatarIcon}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Nest Selector Dock (replaces the standard discord left-rail) */}
        <NestSelector
          nests={nests}
          activeNestId={activeNestId}
          onSelectNest={(id) => {
            setActiveNestId(id);
            // close drawer if open
            setIsSqueaksOpen(false);
          }}
          onOpenCreateNest={() => setIsCreateNestOpen(true)}
        />

        {/* MAIN BODY AREA */}
        <div className={`flex-1 flex flex-col min-h-0 relative transition-all duration-300 overflow-hidden ${activeWallpaperObj.style}`}>
          
          {activeNestId === 'dms' ? (
            <DmPanel
              currentUser={currentUser}
              initialActiveUserId={activeDmUserId}
              onClearInitialActiveUserId={() => setActiveDmUserId(null)}
              onUpdateCurrentUser={setCurrentUser}
            />
          ) : activeSqueak ? (
            activeSqueak.type === 'voice' ? (
              // Active Voice Lounge
              <EchoLounge
                squeak={activeSqueak}
                currentUser={currentUser}
                onLeave={() => {
                  // Switch to the first text channel or general
                  const firstText = squeaks.find(s => s.type === 'text');
                  if (firstText) {
                    setActiveSqueakId(firstText.id);
                  }
                }}
              />
            ) : (
              // Active Chat Squeak Panel
              <ChatPanel
                squeak={activeSqueak}
                currentUser={currentUser}
                messages={messages}
                onStartDm={handleStartDm}
              />
            )
          ) : (
            // No channel selected state
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-850 flex items-center justify-center mb-4 text-3xl shadow-xl animate-bounce">
                🌪️
              </div>
              <h3 className="text-base font-bold text-zinc-300">Nido vacío o silencioso</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-[240px]">
                No hay squeaks en este nido. ¡Abre el panel lateral y crea uno!
              </p>
              <button
                onClick={() => setIsSqueaksOpen(true)}
                className="mt-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-amber-500/10"
              >
                Abrir Squeaks
              </button>
            </div>
          )}

          {/* Squeak (Channels) Left Drawer Selector */}
          <SqueakSelector
            squeaks={squeaks}
            activeSqueakId={activeSqueakId}
            onSelectSqueak={setActiveSqueakId}
            onOpenCreateSqueak={() => setIsCreateSqueakOpen(true)}
            isOpen={isSqueaksOpen}
            onClose={() => setIsSqueaksOpen(false)}
            activeNest={activeNest}
            currentUser={currentUser}
            onOpenEditNest={() => setIsEditNestOpen(true)}
            onOpenManageRoles={() => setIsManageRolesOpen(true)}
            onOpenShareNest={() => setIsShareNestOpen(true)}
          />
        </div>

        {/* BOTTOM VIRTUAL ANDROID BUTTONS */}
        <div className="bg-zinc-950 h-8 flex items-center justify-center gap-12 border-t border-zinc-900/40 select-none z-30">
          {/* Back button (triangular) */}
          <button 
            onClick={() => setIsSqueaksOpen(!isSqueaksOpen)} 
            className="w-3.5 h-3.5 rounded border-l-2 border-b-2 border-zinc-600 transform rotate-45 hover:border-white transition-colors"
          />
          {/* Home button (circle) */}
          <button 
            onClick={() => {
              if (nests.length > 0) {
                const global = nests.find(n => n.id === 'nest-global') || nests[0];
                setActiveNestId(global.id);
              }
              setIsSqueaksOpen(false);
              setIsProfileOpen(false);
            }}
            className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 hover:border-white transition-colors"
          />
          {/* Overview button (square) */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-3.5 h-3.5 rounded border-2 border-zinc-600 hover:border-white transition-colors"
          />
        </div>

        {/* POPUPS & MODALS MODIFIERS */}

        {/* Edit profile dialog modal */}
        <AnimatePresence>
          {isProfileOpen && (
            <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm flex flex-col bg-zinc-950 rounded-3xl border border-zinc-900 p-6 shadow-2xl relative">
                {/* Close Button */}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <UserProfileSetup
                  profile={currentUser}
                  onSave={handleSaveProfile}
                  onClose={() => setIsProfileOpen(false)}
                />
                
                {/* Logout Action at the bottom of Profile Setup when editing */}
                <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-end">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 py-1.5 px-3 rounded-lg hover:bg-red-500/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Settings Dialog Modal */}
        <AnimatePresence>
          {isSettingsOpen && currentUser && (
            <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col">
              <SettingsPanel
                currentUser={currentUser}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                currentWallpaper={currentWallpaper}
                onWallpaperChange={handleWallpaperChange}
                currentAccentColor={currentAccentColor}
                onAccentColorChange={handleAccentColorChange}
                soundEnabled={soundEnabled}
                onSoundToggle={handleSoundToggle}
                onSaveProfile={handleSaveProfile}
                onLogout={handleLogout}
                onClose={() => setIsSettingsOpen(false)}
                onInstallApp={handleInstallPWA}
                installable={!!deferredPrompt}
                notificationsAllowed={notificationsAllowed}
                onRequestNotifications={handleRequestNotifications}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Help Dialog Modal */}
        <AnimatePresence>
          {isHelpOpen && (
            <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-white w-full max-w-sm space-y-4 relative"
              >
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-950 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black font-sans uppercase tracking-widest">
                    {currentLanguage === 'es' ? 'Manual de Shrew' : 'Shrew Manual'}
                  </h4>
                </div>

                <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed max-h-[360px] overflow-y-auto pr-1">
                  {currentLanguage === 'es' ? (
                    <>
                      <p>
                        <strong className="text-white">¿Qué es Shrew?</strong> Es una plataforma de comunicación móvil-first súper veloz inspirada en el hábitat subterráneo de las musarañas.
                      </p>
                      <p>
                        <strong className="text-white">Nidos (Servers):</strong> Cambia de servidor deslizando horizontalmente por la barra de iconos que flota en la parte superior. No hay pesados raíles triples laterales.
                      </p>
                      <p>
                        <strong className="text-white">Squeaks (Chat):</strong> Toca las tres rayitas de arriba a la izquierda para abrir tus canales de texto y chatear libremente.
                      </p>
                      <p>
                        <strong className="text-white">Echoes (Voz):</strong> Entra en un canal de voz y entra en el <strong className="text-emerald-400">Echo Core</strong>. Tu avatar flotará como una molécula acústica. ¡Presiona "Transmitir" para que tu aura brille y pulse en tiempo real!
                      </p>
                      <p className="text-[10px] font-mono text-zinc-600 mt-2">
                        Desarrollado en exclusiva para la Comunidad Shrew. ¡Squeak!
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong className="text-white">What is Shrew?</strong> It's a lightning-fast mobile-first communication platform inspired by the underground habitat of shrews.
                      </p>
                      <p>
                        <strong className="text-white">Nests (Servers):</strong> Switch servers easily by sliding horizontally on the floating icon dock at the top. No heavy, complex sidebar drawers.
                      </p>
                      <p>
                        <strong className="text-white">Squeaks (Chat):</strong> Tap the menu button on the top left to show your text squeaks and start chatting freely.
                      </p>
                      <p>
                        <strong className="text-white">Echoes (Voice):</strong> Connect to a voice squeak and step into the <strong className="text-emerald-400">Echo Core</strong>. Your avatar floats like an acoustic molecule. Click "Transmit" to pulsate your glow in real-time!
                      </p>
                      <p className="text-[10px] font-mono text-zinc-600 mt-2">
                        Exclusively built for the Shrew Community. Squeak!
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dialog modulares creadores */}
        <CreateNestDialog
          isOpen={isCreateNestOpen}
          onClose={() => setIsCreateNestOpen(false)}
          onCreate={handleCreateNest}
        />

        <CreateSqueakDialog
          isOpen={isCreateSqueakOpen}
          onClose={() => setIsCreateSqueakOpen(false)}
          onCreate={handleCreateSqueak}
        />

        {/* Community Settings Dialogs */}
        {activeNest && (
          <>
            <EditNestDialog
              isOpen={isEditNestOpen}
              onClose={() => setIsEditNestOpen(false)}
              nest={activeNest}
            />

            <ManageRolesDialog
              isOpen={isManageRolesOpen}
              onClose={() => setIsManageRolesOpen(false)}
              nest={activeNest}
              currentUser={currentUser!}
              allUsers={allUsers}
            />

            <ShareCommunityDialog
              isOpen={isShareNestOpen}
              onClose={() => setIsShareNestOpen(false)}
              nest={activeNest}
            />
          </>
        )}

        {/* Teleporter Modal overlay */}
        <AnimatePresence>
          {isTeleporterOpen && (
            <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xs bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Close Button */}
                <button
                  onClick={() => setIsTeleporterOpen(false)}
                  className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <Compass className="w-6 h-6 text-amber-500 animate-spin-slow" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Teletransportador Shrew</h3>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">
                    Ingresa un enlace de comunidad o perfil para viajar instantáneamente.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    type="text"
                    value={teleportLink}
                    onChange={(e) => {
                      setTeleportLink(e.target.value);
                      setTeleportError('');
                    }}
                    placeholder="e.g., shrw.gg/n/nest-global"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTeleport(teleportLink);
                      }
                    }}
                  />

                  {teleportError && (
                    <p className="text-[10px] text-red-400 font-bold text-center bg-red-500/5 py-1 px-2 rounded-lg border border-red-500/10">
                      {teleportError}
                    </p>
                  )}

                  <button
                    onClick={() => handleTeleport(teleportLink)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black animate-pulse" />
                    <span>Teletransportar</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PWA INSTALL FLOATING BANNER */}
        <AnimatePresence>
          {showInstallBanner && deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-4 left-4 z-50 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-white">
                  {currentLanguage === 'es' ? 'Instalar Shrew Chat' : 'Install Shrew Chat'}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                  {currentLanguage === 'es' 
                    ? 'Agrégalo a tu pantalla o escritorio para acceder al instante.' 
                    : 'Add to your home screen or desktop for rapid, full-screen access.'}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleInstallPWA}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
                >
                  {currentLanguage === 'es' ? 'Instalar' : 'Install'}
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-zinc-500 hover:text-zinc-300 font-bold text-[10px] py-1 text-center cursor-pointer"
                >
                  {currentLanguage === 'es' ? 'Omitir' : 'Dismiss'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA UPDATE FLOATING BANNER */}
        <AnimatePresence>
          {showAppUpdateBanner && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 p-3.5 px-5 rounded-full shadow-2xl flex items-center gap-3"
            >
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[11px] font-bold text-zinc-200">
                {currentLanguage === 'es' 
                  ? '¡Nueva versión de Shrew Chat lista!' 
                  : 'New Shrew Chat update is ready!'}
              </span>
              <button
                onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[9px] px-3.5 py-1 rounded-full transition-all cursor-pointer uppercase tracking-wider"
              >
                {currentLanguage === 'es' ? 'Actualizar' : 'Update'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
