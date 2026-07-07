import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ShrewLogo } from './ShrewLogo';
import { User, Upload, Image as ImageIcon, Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { loginWithEmail, signUpWithEmail, loginWithGoogle, getUserProfileFromFirestore, getAuthInstance } from '../firebase';

interface UserProfileProps {
  profile: UserProfile | null;
  onSave: (updated: UserProfile) => void;
  onClose?: () => void;
}

export const UserProfileSetup: React.FC<UserProfileProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  const isEn = localStorage.getItem('shrew_language') === 'en';
  
  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'guest'>(profile ? 'guest' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(profile?.name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [statusText, setStatusText] = useState(profile?.statusText || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(profile?.coverUrl || '');
  const [error, setError] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(isEn ? 'Please fill in all fields' : '¡Por favor rellena todos los campos!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userCredential = await loginWithEmail(email.trim(), password);
      const uid = userCredential.user.uid;
      // Try to fetch existing profile from Firestore
      const existingProfile = await getUserProfileFromFirestore(uid);
      if (existingProfile) {
        onSave(existingProfile);
      } else {
        // No existing profile, let's transition to guest/profile creation view using the firebase uid
        setName(email.split('@')[0]);
        setAuthMode('guest');
        setError(isEn ? 'Account authenticated! Now customize your Shrew profile.' : '¡Cuenta autenticada! Ahora personaliza tu perfil de Musaraña.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(isEn ? 'Please fill in all fields' : '¡Por favor rellena todos los campos!');
      return;
    }
    if (password.length < 6) {
      setError(isEn ? 'Password must be at least 6 characters' : 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email.trim(), password);
      // Success! Transition to profile setup using the new firebase uid
      setAuthMode('guest');
      setName(email.split('@')[0]);
      setError(isEn ? 'Account created! Now customize your Shrew profile.' : '¡Cuenta creada! Ahora personaliza tu perfil de Musaraña.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await loginWithGoogle();
      const uid = userCredential.user.uid;
      const existingProfile = await getUserProfileFromFirestore(uid);
      if (existingProfile) {
        onSave(existingProfile);
      } else {
        setName(userCredential.user.displayName || 'Shrew ' + Math.floor(Math.random() * 100));
        setAvatarUrl(userCredential.user.photoURL || '');
        setAuthMode('guest');
        setError(isEn ? 'Authenticated with Google! Now customize your Shrew profile.' : '¡Autenticado con Google! Ahora personaliza tu perfil de Musaraña.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFile = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      setError(isEn ? 'Avatar must be less than 1MB' : 'La foto de perfil debe ser menor a 1MB');
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
      setError(isEn ? 'Cover photo must be less than 1MB' : 'La portada debe ser menor a 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(isEn ? 'Please enter a nickname!' : '¡Inserta un apodo de Musaraña!');
      return;
    }
    if (trimmedName.length > 20) {
      setError(isEn ? 'Nickname must be under 20 chars' : 'El apodo debe tener menos de 20 caracteres.');
      return;
    }

    let trimmedUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!trimmedUsername) {
      trimmedUsername = trimmedName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 100);
    }
    
    if (trimmedUsername.length > 18) {
      setError(isEn ? 'Username must be under 18 chars' : 'El nombre de usuario debe ser menor a 18 caracteres.');
      return;
    }

    const authUser = getAuthInstance()?.currentUser;
    onSave({
      id: profile?.id || authUser?.uid || 'shrew-' + Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      username: trimmedUsername,
      avatarColor: '#27272a', // neutral backing
      avatarIcon: '👤', // default placeholder
      avatarUrl: avatarUrl || undefined,
      coverUrl: coverUrl || undefined,
      statusText: statusText.trim() || undefined,
      bio: bio.trim() || undefined,
      status: profile?.status || 'online',
      joinedAt: profile?.joinedAt || Date.now(),
      friends: profile?.friends || [],
      blockedUsers: profile?.blockedUsers || [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-white overflow-y-auto max-h-[90vh] relative scrollbar-none"
      id="profile-setup-card"
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center mb-5">
        <ShrewLogo size={56} withBackground={true} className="mb-2" />
        <h2 className="text-xl font-bold font-sans tracking-tight text-center">
          {profile ? (isEn ? 'Customize Shrew' : 'Personalizar Musaraña') : (isEn ? 'Welcome to Shrew!' : '¡Bienvenido a Shrew!')}
        </h2>
        <p className="text-zinc-500 text-[11px] text-center mt-0.5">
          {profile ? (isEn ? 'Edit your underground identity' : 'Modifica tu identidad en el nido') : (isEn ? 'Create your shrew profile to start' : 'Crea tu perfil de musaraña para comenzar')}
        </p>
      </div>

      {/* Tab selectors for authentication (only shown if not editing a profile) */}
      {!profile && (
        <div className="flex bg-zinc-900/60 p-1 rounded-xl mb-5 border border-zinc-900" id="auth-tabs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              authMode === 'login'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isEn ? 'Log In' : 'Iniciar Sesión'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              authMode === 'signup'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isEn ? 'Sign Up' : 'Registrarse'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('guest');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              authMode === 'guest'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isEn ? 'Guest' : 'Invitado'}
          </button>
        </div>
      )}

      {/* Conditional Forms rendering */}
      {(!profile && authMode === 'login') && (
        <form onSubmit={handleEmailLogin} className="space-y-4" id="login-form">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shrew@nest.com"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> {isEn ? 'Password' : 'Contraseña'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center mt-1 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isEn ? 'Log In' : 'Entrar en el Túnel'}</span>
              </>
            )}
          </button>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-900"></div></div>
            <span className="relative px-3 bg-zinc-950 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">o</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-200 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-amber-500" />
            <span>{isEn ? 'Sign in with Google' : 'Iniciar Sesión con Google'}</span>
          </button>
        </form>
      )}

      {(!profile && authMode === 'signup') && (
        <form onSubmit={handleEmailSignUp} className="space-y-4" id="signup-form">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shrew@nest.com"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> {isEn ? 'Password' : 'Contraseña'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center mt-1 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isEn ? 'Create Account' : 'Registrar Cuenta'}</span>
              </>
            )}
          </button>
        </form>
      )}

      {(profile || authMode === 'guest') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Photo / Header Customizer */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> {isEn ? 'Profile Cover (Image/GIF)' : 'Portada de Perfil (Imagen/GIF)'}
            </label>
            
            <div className="relative w-full h-24 bg-zinc-900 rounded-2xl border border-zinc-850 overflow-hidden group">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 border border-dashed border-zinc-850">
                  <Upload className="w-5 h-5 mb-1 text-zinc-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{isEn ? 'No Cover Photo' : 'Sin Imagen de Portada'}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                >
                  {isEn ? 'Upload' : 'Subir'}
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                  >
                    {isEn ? 'Remove' : 'Eliminar'}
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
              placeholder={isEn ? 'Paste cover Image/GIF URL...' : 'O pega la URL de un GIF/Imagen de portada...'}
              className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-amber-500/50 text-zinc-300 transition-colors"
            />
          </div>

          {/* Profile Avatar customizer */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-zinc-400" /> {isEn ? 'Avatar Picture (Image/GIF)' : 'Foto de Perfil (Imagen/GIF)'}
            </label>
            <div className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900">
              <div className="relative w-14 h-14 bg-zinc-900 rounded-xl border border-zinc-800 flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 py-1.5 px-3 rounded-lg border border-zinc-850 transition-colors"
                  >
                    {isEn ? 'Upload File' : 'Subir Archivo'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="bg-red-950/20 hover:bg-red-900/20 text-red-400 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-900/30 transition-colors"
                    >
                      {isEn ? 'Remove' : 'Quitar'}
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
                  placeholder={isEn ? 'Or paste Avatar Image/GIF URL...' : 'O pega la URL de un GIF/Imagen...'}
                  className="w-full bg-zinc-900/60 border border-zinc-850 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-amber-500/50 text-zinc-300 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Name and Username Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1 uppercase">
                {isEn ? 'Nickname' : 'Apodo'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Musaraña"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                maxLength={20}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1 uppercase">
                {isEn ? 'Username' : 'Nombre de Usuario'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-500 text-xs font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setError('');
                  }}
                  placeholder="usuario"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl pl-6 pr-3 py-2 text-xs focus:outline-none transition-colors font-mono"
                  maxLength={18}
                />
              </div>
            </div>
          </div>

          {/* Custom Status Message */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1 uppercase">
              {isEn ? 'Personal Status' : 'Estado Personal'}
            </label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder={isEn ? 'What are you doing?' : '¿Qué estás haciendo?'}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
              maxLength={60}
            />
          </div>

          {/* User Biography (Bio) Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1 uppercase">
              {isEn ? 'Biography / Description' : 'Biografía / Descripción'}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isEn ? 'Describe yourself deep inside the tunnel...' : 'Descríbete en las profundidades del túnel...'}
              className="w-full h-16 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors resize-none scrollbar-none"
              maxLength={160}
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center mt-1 font-bold">{error}</p>}

          {/* Action Button */}
          <div className="flex gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 rounded-xl font-medium text-xs transition-colors border border-zinc-800"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 rounded-xl font-bold text-xs transition-all shadow-xl shadow-amber-500/10 active:scale-95 cursor-pointer"
              id="save-profile-btn"
            >
              {isEn ? 'Ready, burrow!' : 'Listo, ¡a excavar!'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};
