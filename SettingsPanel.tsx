import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MobileSession } from '../types';
import { listenToSessions, recordMobileSession } from '../firebase';
import { 
  ArrowLeft, 
  Globe, 
  Image as ImageIcon, 
  LogOut, 
  User, 
  Settings, 
  Volume2, 
  VolumeX, 
  Check, 
  Smartphone,
  Info,
  Upload,
  Plus,
  Tv,
  ArrowRight,
  MessageSquare,
  Mail,
  Heart,
  Bell,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPanelProps {
  currentUser: UserProfile;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  currentWallpaper: string;
  onWallpaperChange: (wp: string) => void;
  currentAccentColor: string;
  onAccentColorChange: (color: string) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onSaveProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onClose: () => void;
  onInstallApp?: () => void;
  installable?: boolean;
  notificationsAllowed?: boolean;
  onRequestNotifications?: () => void;
}

export const WALLPAPERS = [
  { id: 'dark-default', nameEs: 'Túnel Oscuro', nameEn: 'Dark Tunnel', style: 'bg-zinc-950', preview: 'bg-zinc-900 border border-zinc-800' },
  { id: 'amber-glow', nameEs: 'Brasas de Ámbar', nameEn: 'Amber Glow', style: 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,#09090b_100%)]', preview: 'bg-gradient-to-br from-amber-950/40 to-black border border-amber-900/30' },
  { id: 'emerald-cave', nameEs: 'Cueva de Esmeralda', nameEn: 'Emerald Cave', style: 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,#09090b_100%)]', preview: 'bg-gradient-to-br from-emerald-950/40 to-black border border-emerald-900/30' },
  { id: 'cyber-neon', nameEs: 'Sintetizador de Neón', nameEn: 'Cyber Neon', style: 'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,#09090b_100%)]', preview: 'bg-gradient-to-br from-purple-950/40 to-black border border-purple-900/30' },
  { id: 'sunset-dunes', nameEs: 'Dunas de Fuego', nameEn: 'Sunset Dunes', style: 'bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12)_0%,#09090b_100%)]', preview: 'bg-gradient-to-br from-red-950/40 to-black border border-red-900/30' },
  { id: 'matrix-terminal', nameEs: 'Red Digital', nameEn: 'Matrix Net', style: 'bg-zinc-950 bg-[radial-gradient(rgba(34,197,94,0.08)_1px,transparent_1px)] bg-[size:16px_16px]', preview: 'bg-zinc-950 border border-emerald-950/80 [background-image:radial-gradient(rgba(34,197,94,0.2)_1px,transparent_1px)] [background-size:8px_8px]' }
];

export const ACCENT_COLORS = [
  { id: 'amber', hex: '#f59e0b', labelEs: 'Ámbar', labelEn: 'Amber', colorClass: 'bg-amber-500' },
  { id: 'emerald', hex: '#10b981', labelEs: 'Esmeralda', labelEn: 'Emerald', colorClass: 'bg-emerald-500' },
  { id: 'blue', hex: '#3b82f6', labelEs: 'Azul', labelEn: 'Blue', colorClass: 'bg-blue-500' },
  { id: 'pink', hex: '#ec4899', labelEs: 'Rosa', labelEn: 'Pink', colorClass: 'bg-pink-500' },
  { id: 'purple', hex: '#8b5cf6', labelEs: 'Púrpura', labelEn: 'Purple', colorClass: 'bg-purple-500' },
];

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

const TRANSLATIONS = {
  es: {
    settingsTitle: 'Ajustes',
    languageSection: 'Idioma y Perfil',
    profileSection: 'Editar Perfil',
    wallpaperSection: 'Fondo de Pantalla',
    moreSection: 'Más Ajustes',
    languageLabel: 'Idioma de la Interfaz',
    languageDesc: 'Selecciona el idioma para navegar y configurar Shrew.',
    profileNickname: 'Apodo de Musaraña',
    profileUsername: 'Nombre de usuario',
    profileStatus: 'Estado Personal',
    saveProfileBtn: 'Guardar Perfil',
    wallpaperDesc: 'Elige el fondo ambiental para los chats y canales de voz.',
    accentColor: 'Aura / Color de Acento',
    accentColorDesc: 'Cambia el matiz de tu interfaz huyendo de lo convencional.',
    soundEffects: 'Efectos de Sonido',
    soundDesc: 'Activa o desactiva alertas del túnel.',
    soundOn: 'Activado',
    soundOff: 'Silenciado',
    logoutBtn: 'Cerrar Sesión',
    logoutWarning: '¿Quieres cerrar sesión? Borrará tu identidad local.',
    closeBtn: 'Cerrar',
    successSaved: '¡Perfil actualizado en Firestore!',
    saving: 'Guardando...',
    placeholderName: 'Tu apodo...',
    placeholderStatus: '¿En qué estás pensando?...',
  },
  en: {
    settingsTitle: 'Settings',
    languageSection: 'Language & Profile',
    profileSection: 'Edit Profile',
    wallpaperSection: 'App Wallpaper',
    moreSection: 'More Settings',
    languageLabel: 'Interface Language',
    languageDesc: 'Select language to customize your profile and explore Shrew.',
    profileNickname: 'Shrew Nickname',
    profileUsername: 'Username',
    profileStatus: 'Personal Status',
    saveProfileBtn: 'Save Profile',
    wallpaperDesc: 'Choose the ambient background for chats and voice echoes.',
    accentColor: 'Aura / Accent Color',
    accentColorDesc: 'Change the visual tint of your subterranean interface.',
    soundEffects: 'Sound Effects',
    soundDesc: 'Enable or disable interactive tunnel alerts.',
    soundOn: 'Enabled',
    soundOff: 'Muted',
    logoutBtn: 'Sign Out',
    logoutWarning: 'Are you sure you want to sign out? This clears local identity.',
    closeBtn: 'Close',
    successSaved: 'Profile updated in Firestore!',
    saving: 'Saving...',
    placeholderName: 'Your nickname...',
    placeholderStatus: 'What are you thinking about?...',
  },
  fr: {
    settingsTitle: 'Paramètres',
    languageSection: 'Langue et Profil',
    profileSection: 'Modifier le Profil',
    wallpaperSection: 'Fond d\'Écran',
    moreSection: 'Plus de Paramètres',
    languageLabel: 'Langue de l\'Interface',
    languageDesc: 'Sélectionnez la langue pour naviguer et configurer Shrew.',
    profileNickname: 'Surnom de Musaraigne',
    profileUsername: 'Nom d\'utilisateur',
    profileStatus: 'Statut Personnel',
    saveProfileBtn: 'Enregistrer le Profil',
    wallpaperDesc: 'Choisissez l\'arrière-plan ambiant pour les discussions.',
    accentColor: 'Aura / Couleur d\'Accent',
    accentColorDesc: 'Changez la nuance visuelle de votre interface.',
    soundEffects: 'Effets Sonores',
    soundDesc: 'Activez ou désactivez les alertes du tunnel.',
    soundOn: 'Activé',
    soundOff: 'Muet',
    logoutBtn: 'Se Déconnecter',
    logoutWarning: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    closeBtn: 'Fermer',
    successSaved: 'Profil mis à jour dans Firestore !',
    saving: 'Enregistrement...',
    placeholderName: 'Votre surnom...',
    placeholderStatus: 'À quoi pensez-vous ?...',
  },
  de: {
    settingsTitle: 'Einstellungen',
    languageSection: 'Sprache & Profil',
    profileSection: 'Profil bearbeiten',
    wallpaperSection: 'Hintergrundbild',
    moreSection: 'Weitere Einstellungen',
    languageLabel: 'Oberflächensprache',
    languageDesc: 'Wählen Sie die Sprache, um Ihr Profil anzupassen und Shrew zu erkunden.',
    profileNickname: 'Spitzname der Spitzmaus',
    profileUsername: 'Benutzername',
    profileStatus: 'Persönlicher Status',
    saveProfileBtn: 'Profil speichern',
    wallpaperDesc: 'Wählen Sie den Umgebungs-Hintergrund für Chats.',
    accentColor: 'Aura / Akzentfarbe',
    accentColorDesc: 'Ändern Sie den visuellen Farbton Ihrer Schnittstelle.',
    soundEffects: 'Soundeffekte',
    soundDesc: 'Aktivieren oder deaktivieren Sie interaktive Tunnel-Warnungen.',
    soundOn: 'Aktiviert',
    soundOff: 'Stumm',
    logoutBtn: 'Abmelden',
    logoutWarning: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
    closeBtn: 'Schließen',
    successSaved: 'Profil in Firestore aktualisiert!',
    saving: 'Speichern...',
    placeholderName: 'Ihr Spitzname...',
    placeholderStatus: 'Woran denken Sie?...',
  },
  it: {
    settingsTitle: 'Impostazioni',
    languageSection: 'Lingua e Profilo',
    profileSection: 'Modifica Profilo',
    wallpaperSection: 'Sfondo dell\'App',
    moreSection: 'Altre Impostazioni',
    languageLabel: 'Lingua dell\'Interfaccia',
    languageDesc: 'Seleziona la lingua per navigare e configurare Shrew.',
    profileNickname: 'Soprannome Toporagno',
    profileUsername: 'Nome utente',
    profileStatus: 'Stato Personale',
    saveProfileBtn: 'Salva Profilo',
    wallpaperDesc: 'Scegli lo sfondo ambientale per le chat.',
    accentColor: 'Aura / Colore Accento',
    accentColorDesc: 'Cambia la tonalità visiva della tua interfaccia.',
    soundEffects: 'Effetti Sonori',
    soundDesc: 'Attiva o disattiva gli avvisi del tunnel.',
    soundOn: 'Attivato',
    soundOff: 'Silenziato',
    logoutBtn: 'Disconnettersi',
    logoutWarning: 'Sei sicuro di voler uscire?',
    closeBtn: 'Chiudi',
    successSaved: 'Profilo aggiornato in Firestore!',
    saving: 'Salvataggio...',
    placeholderName: 'Il tuo soprannome...',
    placeholderStatus: 'A cosa stai pensando?...',
  },
  pt: {
    settingsTitle: 'Configurações',
    languageSection: 'Idioma e Perfil',
    profileSection: 'Editar Perfil',
    wallpaperSection: 'Plano de Fundo',
    moreSection: 'Mais Configurações',
    languageLabel: 'Idioma da Interface',
    languageDesc: 'Selecione o idioma para navegar e configurar o Shrew.',
    profileNickname: 'Apelido do Musaranho',
    profileUsername: 'Nome de usuário',
    profileStatus: 'Status Pessoal',
    saveProfileBtn: 'Salvar Perfil',
    wallpaperDesc: 'Escolha o fundo ambiental para os bate-papos.',
    accentColor: 'Aura / Cor de Destaque',
    accentColorDesc: 'Altere a tonalidade visual da sua interface.',
    soundEffects: 'Efeitos de Som',
    soundDesc: 'Ative ou desactive os alertas do túnel.',
    soundOn: 'Ativado',
    soundOff: 'Silenciado',
    logoutBtn: 'Sair',
    logoutWarning: 'Tem certeza de que deseja sair?',
    closeBtn: 'Fechar',
    successSaved: 'Perfil atualizado no Firestore!',
    saving: 'Salvando...',
    placeholderName: 'Seu apelido...',
    placeholderStatus: 'O que você está pensando?...',
  },
  ja: {
    settingsTitle: '設定',
    languageSection: '言語とプロフィール',
    profileSection: 'プロフィール編集',
    wallpaperSection: 'アプリの壁紙',
    moreSection: 'その他の設定',
    languageLabel: 'インターフェース言語',
    languageDesc: 'Shrewを探索するための言語を選択してください。',
    profileNickname: 'トガリネズミのニックネーム',
    profileUsername: 'ユーザー名',
    profileStatus: '自己紹介・ステータス',
    saveProfileBtn: 'プロフィールを保存',
    wallpaperDesc: 'チャット의背景を選択します。',
    accentColor: 'オーラ / アクセントカラー',
    accentColorDesc: 'インターフェースの色調を変更します。',
    soundEffects: '効果音',
    soundDesc: '通知音を有効または無効にします。',
    soundOn: '有効',
    soundOff: 'ミュート',
    logoutBtn: 'ログアウト',
    logoutWarning: '本当にログアウトしますか？',
    closeBtn: '閉じる',
    successSaved: 'Firestoreでプロフィールが更新されました！',
    saving: '保存中...',
    placeholderName: 'ニックネーム...',
    placeholderStatus: '今何考えてる？...',
  }
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currentUser,
  currentLanguage,
  onLanguageChange,
  currentWallpaper,
  onWallpaperChange,
  currentAccentColor,
  onAccentColorChange,
  soundEnabled,
  onSoundToggle,
  onSaveProfile,
  onLogout,
  onClose,
  onInstallApp,
  installable = false,
  notificationsAllowed = false,
  onRequestNotifications,
}) => {
  const t = TRANSLATIONS[currentLanguage as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  const isEs = currentLanguage === 'es';

  const [subView, setSubView] = useState<'menu' | 'profile' | 'sessions' | 'appearance' | 'language' | 'chat' | 'about'>('menu');
  const [activeDialogMessage, setActiveDialogMessage] = useState<{ title: string; content: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutNotice, setShowLogoutNotice] = useState(false);
  
  // Profile local states
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [statusText, setStatusText] = useState(currentUser.statusText || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(currentUser.coverUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sessions State
  const [sessions, setSessions] = useState<MobileSession[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleShowContact = () => {
    const title = isEs ? 'Contáctanos' : 'Contact Us';
    let content = '';
    switch (currentLanguage) {
      case 'es':
        content = "No puedes contactarnos en este momento, pero pronto podrás hacerlo para hacernos llegar tus sugerencias o problemas con la aplicación.";
        break;
      case 'fr':
        content = "Vous ne pouvez pas nous contacter pour le moment, mais vous le pourrez bientôt pour nous faire part de vos suggestions ou problèmes avec l'application.";
        break;
      case 'de':
        content = "Sie können uns im Moment nicht kontaktieren, aber Sie werden es bald tun können, um uns Vorschläge oder Probleme mit der App mitzuteilen.";
        break;
      case 'it':
        content = "Non puoi contattarci in questo momento, ma presto potrai farlo per farci sapere suggerimenti o problemi con l'app.";
        break;
      case 'pt':
        content = "Você não pode entrar em contato conosco agora, mas em breve poderá para nos informar sobre sugestões ou problemas com o aplicativo.";
        break;
      case 'ja':
        content = "現在はお問い合わせいただけませんが、アプリの提案や問題についてお知らせいただけるよう、まもなく可能になります。";
        break;
      default:
        content = "You can't contact us right now, but you will soon to let us know about suggestions or problems with the app.";
    }
    setActiveDialogMessage({ title, content });
  };

  const handleShowDonate = () => {
    const title = isEs ? 'Donar' : 'Donate';
    let content = '';
    switch (currentLanguage) {
      case 'es':
        content = "No puedes donar en este momento, pero pronto podrás. Muchas gracias por intentar aportar tu granito de arena.";
        break;
      case 'fr':
        content = "Vous ne pouvez pas faire de don pour le moment, mais vous le pourrez bientôt. Merci beaucoup d'essayer d'apporter votre contribution.";
        break;
      case 'de':
        content = "Sie können im Moment nicht spenden, aber Sie werden es bald können. Vielen Dank, dass Sie versuchen, Ihren Beitrag zu leisten.";
        break;
      case 'it':
        content = "Non puoi donare in questo momento, ma presto potrai farlo. Grazie mille per aver cercato di fare la tua parte.";
        break;
      case 'pt':
        content = "Você não pode doar agora, mas poderá em breve. Muito obrigado por tentar fazer a sua parte.";
        break;
      case 'ja':
        content = "現在は寄付いただけませんが、間もなく可能になります。ご協力いただき、誠にありがとうございます。";
        break;
      default:
        content = "You can't donate right now, but you will soon. Thank you so much for trying to do your bit.";
    }
    setActiveDialogMessage({ title, content });
  };

  // Subscribe to sessions
  useEffect(() => {
    const unsubscribe = listenToSessions(currentUser.id, (loaded) => {
      setSessions(loaded);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  // Record at least one initial mock mobile session for realism
  useEffect(() => {
    if (sessions.length === 0) {
      recordMobileSession(
        currentUser.id,
        'iPhone 15 Pro',
        'iOS 17.4',
        '192.168.1.84',
        isEs ? 'Madrid, España' : 'Madrid, Spain',
        true
      );
    }
  }, [sessions, currentUser.id, isEs]);

  const handleAvatarFile = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      setError(isEs ? 'La foto de perfil debe ser menor a 1MB' : 'Avatar file must be less than 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      setError(isEs ? 'La portada debe ser menor a 1MB' : 'Cover image must be less than 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isEs ? '¡El apodo no puede estar vacío!' : 'Nickname cannot be empty!');
      return;
    }
    setSaving(true);
    
    setTimeout(() => {
      onSaveProfile({
        ...currentUser,
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        statusText: statusText.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        coverUrl: coverUrl || undefined
      });
      setSaving(false);
    }, 400);
  };

  const handleAddMockSession = () => {
    const mobileDevices = [
      { name: 'Samsung Galaxy S24', os: 'Android 14', locEs: 'Sevilla, España', locEn: 'Seville, Spain' },
      { name: 'Google Pixel 8 Pro', os: 'Android 14', locEs: 'Barcelona, España', locEn: 'Barcelona, Spain' },
      { name: 'iPad Pro M4', os: 'iPadOS 17.5', locEs: 'Valencia, España', locEn: 'Valencia, Spain' },
      { name: 'iPhone 15 Pro Max', os: 'iOS 17.5', locEs: 'Bilbao, España', locEn: 'Bilbao, Spain' }
    ];
    
    const picked = mobileDevices[Math.floor(Math.random() * mobileDevices.length)];
    const ip = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
    
    recordMobileSession(
      currentUser.id,
      picked.name,
      picked.os,
      ip,
      isEs ? picked.locEs : picked.locEn,
      false
    );
  };

  const subViewTitles: Record<string, string> = {
    profile: isEs ? 'Perfil' : 'Profile',
    sessions: isEs ? 'Sesiones' : 'Sessions',
    appearance: isEs ? 'Apariencia' : 'Appearance',
    language: isEs ? 'Idioma' : 'Language',
    chat: isEs ? 'Ajustes de Chat' : 'Chat Settings',
    about: isEs ? 'Acerca de Shrew' : 'About Shrew',
  };

  const MenuRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }> = ({ icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3.5 px-4 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl border border-zinc-900/60 transition-all text-left active:scale-[0.99] group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
          {icon}
        </div>
        <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full bg-zinc-950 flex flex-col overflow-hidden relative z-50 text-white"
      id="settings-panel-root"
    >
      {/* Header bar */}
      <div className="px-4 py-4 border-b border-zinc-900 bg-zinc-950 flex items-center gap-3 select-none">
        <button
          onClick={() => {
            if (subView === 'menu') {
              onClose();
            } else {
              setSubView('menu');
            }
          }}
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
          title={isEs ? 'Volver' : 'Back'}
          id="settings-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-200" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-wider font-sans">
            {subView === 'menu' 
              ? (isEs ? 'Ajustes' : 'Settings') 
              : subViewTitles[subView] || (isEs ? 'Ajustes' : 'Settings')}
          </h2>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* SUBVIEW: MENU */}
        {subView === 'menu' && (
          <div className="space-y-6 px-4 py-4 pb-12 overflow-y-auto flex-1 no-scrollbar">
            {/* Account Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500 pl-2">
                {isEs ? 'Cuenta' : 'Account'}
              </span>
              <div className="space-y-1.5">
                <MenuRow 
                  icon={<User className="w-4 h-4" />} 
                  label={isEs ? 'Perfil' : 'Profile'} 
                  onClick={() => setSubView('profile')} 
                />
                <MenuRow 
                  icon={<Smartphone className="w-4 h-4" />} 
                  label={isEs ? 'Sesiones' : 'Sessions'} 
                  onClick={() => setSubView('sessions')} 
                />
              </div>
            </div>

            {/* General Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500 pl-2">
                {isEs ? 'General' : 'General'}
              </span>
              <div className="space-y-1.5">
                <MenuRow 
                  icon={<ImageIcon className="w-4 h-4" />} 
                  label={isEs ? 'Apariencia' : 'Appearance'} 
                  onClick={() => setSubView('appearance')} 
                />
                <MenuRow 
                  icon={<Globe className="w-4 h-4" />} 
                  label={isEs ? 'Idioma' : 'Language'} 
                  onClick={() => setSubView('language')} 
                />
                <MenuRow 
                  icon={<MessageSquare className="w-4 h-4" />} 
                  label={isEs ? 'Ajustes de Chat' : 'Chat Settings'} 
                  onClick={() => setSubView('chat')} 
                />
              </div>
            </div>

            {/* Miscellaneous Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500 pl-2">
                {isEs ? 'Varios' : 'Miscellaneous'}
              </span>
              <div className="space-y-1.5">
                <MenuRow 
                  icon={<Info className="w-4 h-4" />} 
                  label={isEs ? 'Acerca de Shrew' : 'About Shrew'} 
                  onClick={() => setSubView('about')} 
                />
                <MenuRow 
                  icon={<Mail className="w-4 h-4" />} 
                  label={isEs ? 'Contáctanos' : 'Contact Us'} 
                  onClick={handleShowContact} 
                />
                <MenuRow 
                  icon={<Heart className="w-4 h-4" />} 
                  label={isEs ? 'Donar' : 'Donate'} 
                  onClick={handleShowDonate} 
                />
              </div>
            </div>

            {/* Session Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500 pl-2">
                {isEs ? 'Sesión' : 'Session'}
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 py-3 px-3.5 bg-red-950/15 hover:bg-red-950/25 border border-red-900/20 text-red-400 rounded-xl transition-all text-left cursor-pointer"
                  id="settings-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold">{isEs ? 'Cerrar Sesión' : 'Log Out'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Version Tag */}
            <div className="pt-8 text-center select-none pb-4 border-t border-zinc-900/30">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
                Shrew v1.1.1
              </p>
              <p className="text-[7px] font-mono text-zinc-700 uppercase tracking-widest mt-0.5">
                Shrew Platforms Inc
              </p>
            </div>
          </div>
        )}

        {/* SUBVIEW: PROFILE */}
        {subView === 'profile' && (
          <div className="px-4 py-5 space-y-6">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
                <h3 className="text-xs font-black uppercase text-amber-500/90 tracking-widest">{t.profileSection}</h3>
                {currentUser.joinedAt && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {isEs ? 'Miembro: ' : 'Joined: '}
                    {new Date(currentUser.joinedAt).toLocaleDateString(isEs ? 'es-ES' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>

              {/* Profile Cover Customizer */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-500" /> {isEs ? 'Portada de Perfil (GIF o Imagen)' : 'Profile Cover (GIF or Image)'}
                </label>
                
                <div className="relative w-full h-24 bg-zinc-900 rounded-2xl border border-zinc-850 overflow-hidden group">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 border border-dashed border-zinc-800">
                      <Upload className="w-5 h-5 mb-1 text-zinc-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{isEs ? 'Sin Imagen de Portada' : 'No Cover Photo'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                    >
                      {isEs ? 'Subir' : 'Upload'}
                    </button>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                      >
                        {isEs ? 'Eliminar' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder={isEs ? 'O pega la URL de un GIF/Imagen de portada...' : 'Or paste cover Image/GIF URL...'}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-300 transition-colors font-mono"
                />
              </div>
              
              {/* Avatar Preview & File Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-500" /> {isEs ? 'Avatar (GIF o Imagen)' : 'Avatar Picture (GIF or Image)'}
                </label>
                <div className="flex items-center gap-4 p-3 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                  <div 
                    className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 overflow-hidden flex-shrink-0"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl">{currentUser.avatarIcon}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 py-1.5 px-3 rounded-lg border border-zinc-850 transition-colors cursor-pointer"
                      >
                        {isEs ? 'Subir Foto' : 'Upload File'}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="bg-red-950/20 hover:bg-red-900/20 text-red-400 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-900/30 transition-colors"
                        >
                          {isEs ? 'Quitar' : 'Remove'}
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder={isEs ? 'O pega la URL de un GIF/Imagen de perfil...' : 'Or paste Avatar Image/GIF URL...'}
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-amber-500/50 text-zinc-300 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400">{t.profileNickname}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder={t.placeholderName}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400">{t.profileUsername}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-zinc-500 text-xs font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl pl-7 pr-3 py-2.5 text-xs focus:outline-none transition-colors font-mono text-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400">{t.profileStatus}</label>
                  <input
                    type="text"
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder={t.placeholderStatus}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors"
                    maxLength={60}
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 rounded-xl font-bold text-xs transition-all shadow-xl shadow-amber-500/10 active:scale-95"
                id="save-settings-profile-btn"
              >
                {saving ? t.saving : t.saveProfileBtn}
              </button>
            </form>
          </div>
        )}

        {/* SUBVIEW: SESSIONS */}
        {subView === 'sessions' && (
          <div className="px-4 py-5 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">
                    {isEs ? 'Sesiones Activas' : 'Device Sessions'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddMockSession}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={isEs ? 'Registrar Sesión Móvil' : 'Record Mobile Session'}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 leading-snug">
                {isEs 
                  ? 'Dispositivos autorizados para acceder a los túneles seguros de Shrew.'
                  : 'Authorized devices signed in to access your secure Shrew tunnels.'}
              </p>

              <div className="space-y-2 pt-1">
                {/* Simulated Web Current Session (always current) */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-900 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white">Navegador Web Sandbox</span>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider">
                          {isEs ? 'ACTIVA' : 'CURRENT'}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                        Linux Cloud Run Container • IP: 10.240.0.12
                      </p>
                    </div>
                  </div>
                </div>

                {/* DB Sessions */}
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-3 bg-zinc-900/20 rounded-xl border border-zinc-900/60 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/40 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-zinc-200">{sess.deviceName}</span>
                          {sess.isCurrent && (
                            <span className="bg-zinc-800 text-zinc-400 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider font-mono">
                              MÓVIL
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                          {sess.os} • IP: {sess.ipAddress} • {sess.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono uppercase">
                      {isEs ? 'Registrado' : 'Registered'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: APPEARANCE */}
        {subView === 'appearance' && (
          <div className="px-4 py-5 space-y-6">
            {/* Wallpaper selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-500/90 tracking-widest">{t.wallpaperSection}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">{t.wallpaperDesc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {WALLPAPERS.map((wp) => {
                  const isSelected = currentWallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => onWallpaperChange(wp.id)}
                      className={`h-24 rounded-2xl p-3 flex flex-col justify-between items-start text-left relative overflow-hidden transition-all hover:scale-[1.02] ${wp.preview} ${
                        isSelected ? 'ring-2 ring-amber-500 border-amber-500 bg-zinc-900/20' : 'bg-zinc-900/40 hover:bg-zinc-900/60'
                      }`}
                      id={`wallpaper-${wp.id}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-950/50 border border-zinc-800 flex items-center justify-center text-[10px] z-10">
                        {isSelected && <Check className="w-3 h-3 text-amber-500" />}
                      </div>
                      <span className="text-xs font-bold text-zinc-100 font-sans tracking-tight z-10">
                        {isEs ? wp.nameEs : wp.nameEn}
                      </span>
                      <div className={`absolute inset-0 opacity-10 pointer-events-none ${wp.style}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Selection */}
            <div className="space-y-3 pt-3 border-t border-zinc-900/40">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-500/90 tracking-widest">{t.accentColor}</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">{t.accentColorDesc}</p>
              </div>

              <div className="flex flex-col gap-2 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900">
                {ACCENT_COLORS.map((color) => {
                  const isSelected = currentAccentColor === color.hex;
                  return (
                    <button
                      type="button"
                      key={color.id}
                      onClick={() => onAccentColorChange(color.hex)}
                      className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-zinc-900/40 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3.5 h-3.5 rounded-full ${color.colorClass}`} />
                        <span className="text-xs font-bold text-zinc-300">
                          {isEs ? color.labelEs : color.labelEn}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border border-zinc-850 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-400' : ''}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: LANGUAGE */}
        {subView === 'language' && (
          <div className="px-4 py-5 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-500/90 tracking-widest">{t.languageLabel}</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">{t.languageDesc}</p>
            </div>

            <div className="flex flex-col gap-2 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className="w-full flex items-center justify-between py-3 px-3.5 hover:bg-zinc-900/40 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{lang.flag}</span>
                      <span className="text-xs font-bold text-zinc-300">{lang.label}</span>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border border-zinc-800 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-400' : ''}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW: CHAT */}
        {subView === 'chat' && (
          <div className="px-4 py-5 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-500/90 tracking-widest">{isEs ? 'Preferencias del Túnel' : 'Tunnel Preferences'}</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">{isEs ? 'Configura la interactividad de tus squeaks.' : 'Configure the interactivity of your squeaks.'}</p>
              </div>

              {/* Sound Toggle Section */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                <div className="space-y-0.5 max-w-[75%]">
                  <h4 className="text-xs font-bold text-zinc-200">{t.soundEffects}</h4>
                  <p className="text-[9px] text-zinc-500">{t.soundDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSoundToggle(!soundEnabled)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    soundEnabled 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                      : 'bg-zinc-900 border border-zinc-850 text-zinc-500'
                  }`}
                  id="sound-toggle-btn"
                >
                  {soundEnabled ? <Volume2 className="w-4.5 h-4.5 animate-pulse" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Desktop Notifications Permission Toggle */}
              {onRequestNotifications && (
                <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                  <div className="space-y-0.5 max-w-[75%]">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {isEs ? 'Notificaciones de Escritorio' : 'Desktop Notifications'}
                    </h4>
                    <p className="text-[9px] text-zinc-500">
                      {isEs 
                        ? 'Recibe alertas en Windows, Chrome, Safari o macOS al llegar nuevos mensajes.' 
                        : 'Receive alerts on Windows, Chrome, Safari or macOS on incoming messages.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRequestNotifications}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      notificationsAllowed 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : 'bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-zinc-300'
                    }`}
                    id="notifications-toggle-btn"
                  >
                    <Bell className={`w-4.5 h-4.5 ${notificationsAllowed ? 'animate-bounce' : ''}`} />
                  </button>
                </div>
              )}

              {/* Install PWA Option */}
              {installable && onInstallApp && (
                <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                  <div className="space-y-0.5 max-w-[75%]">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {isEs ? 'Instalar Aplicación Web' : 'Install Web App'}
                    </h4>
                    <p className="text-[9px] text-zinc-500">
                      {isEs 
                        ? 'Instala Shrew Chat directamente en tu pantalla de inicio o escritorio como app dedicada.' 
                        : 'Install Shrew Chat on your home screen or desktop as a dedicated app.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onInstallApp}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-amber-500 text-black hover:bg-amber-400 cursor-pointer"
                    id="pwa-install-settings-btn"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {/* Log Out Button inside Chat as system preference */}
              <div className="pt-4 border-t border-zinc-900/40">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  type="button"
                  className="w-full bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logoutBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: ABOUT */}
        {subView === 'about' && (
          <div className="px-4 py-5 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-zinc-900/50 pb-2">
                <Info className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">
                  {isEs ? 'Acerca de Shrew' : 'About Shrew'}
                </h3>
              </div>

              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900 space-y-4">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-white font-sans uppercase tracking-widest">Shrew Platforms</span>
                    <span className="text-[9px] font-mono bg-zinc-800 text-amber-500 px-1.5 py-0.5 rounded">v1.1.1</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mt-2.5">
                    {isEs 
                      ? 'Shrew es una plataforma de comunicación ultrarrápida, liviana e inspirada en el hábitat subterráneo. Diseñada de forma móvil-first, huye del aburrido y pesado diseño de panel triple tradicional para ofrecer canales dinámicos y voice lounges reactivos con auras acústicas.' 
                      : 'Shrew is a lightning-fast, lightweight communication platform inspired by subterranean habitats. Formed as mobile-first, it sidesteps the traditional, heavy triple-sidebar designs in favor of fluid channels and reactive voice lounge bubbles with acoustic auras.'}
                  </p>
                </div>

                <div className="text-[9px] text-zinc-500 font-mono flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                  <span>{isEs ? 'SOPORTE:' : 'ENGINE:'}</span>
                  <span className="font-bold text-zinc-300">Firebase + React 18</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Beautiful Native Dialog Modal for Contact/Donate */}
      <AnimatePresence>
        {activeDialogMessage && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-white w-full max-w-[280px] space-y-4 relative text-center"
            >
              <h4 className="text-xs font-black font-sans uppercase tracking-widest text-amber-500">
                {activeDialogMessage.title}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {activeDialogMessage.content}
              </p>
              <button
                type="button"
                onClick={() => setActiveDialogMessage(null)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {isEs ? 'Entendido' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Log Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-6" id="logout-confirm-modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-white w-full max-w-[280px] space-y-4 relative text-center"
            >
              <h4 className="text-xs font-black font-sans uppercase tracking-widest text-red-500">
                {isEs ? 'Cerrar Sesión' : 'Log Out'}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isEs 
                  ? '¿Estás seguro de que deseas cerrar la sesión en Shrew? Se borrará tu identidad local.' 
                  : 'Are you sure you want to log out of Shrew? This will clear your local identity.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {isEs ? 'No' : 'No'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setShowLogoutNotice(true);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {isEs ? 'Sí' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Log Out Success Notice Modal */}
      <AnimatePresence>
        {showLogoutNotice && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-6" id="logout-notice-modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-white w-full max-w-[280px] space-y-4 relative text-center"
            >
              <h4 className="text-xs font-black font-sans uppercase tracking-widest text-emerald-500">
                {isEs ? 'Sesión Cerrada' : 'Logged Out'}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isEs 
                  ? '¡Has cerrado la sesión con éxito!' 
                  : 'You have successfully logged out!'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutNotice(false);
                  onLogout();
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {isEs ? 'Entendido' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
