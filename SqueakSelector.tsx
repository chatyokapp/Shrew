import React from 'react';
import { Squeak, Nest, UserProfile } from '../types';
import { MessageSquare, Volume2, Plus, X, Radio, ArrowRight, Edit3, Shield, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SqueakSelectorProps {
  squeaks: Squeak[];
  activeSqueakId: string;
  onSelectSqueak: (squeakId: string) => void;
  onOpenCreateSqueak: () => void;
  isOpen: boolean;
  onClose: () => void;
  activeNest?: Nest;
  currentUser: UserProfile;
  onOpenEditNest: () => void;
  onOpenManageRoles: () => void;
  onOpenShareNest: () => void;
}

export const SqueakSelector: React.FC<SqueakSelectorProps> = ({
  squeaks,
  activeSqueakId,
  onSelectSqueak,
  onOpenCreateSqueak,
  isOpen,
  onClose,
  activeNest,
  currentUser,
  onOpenEditNest,
  onOpenManageRoles,
  onOpenShareNest,
}) => {
  const textSqueaks = squeaks.filter((s) => s.type === 'text');
  const voiceSqueaks = squeaks.filter((s) => s.type === 'voice');

  // Check roles & permissions
  const userRoleIds = activeNest?.memberRoles?.[currentUser.id] || [];
  const userRoles = activeNest?.roles?.filter(r => userRoleIds.includes(r.id)) || [];
  const hasPermission = (perm: string) => {
    if (!activeNest) return false;
    if (activeNest.ownerId === currentUser.id || currentUser.id === 'shrew-founder') return true;
    return userRoles.some(r => r.permissions?.includes(perm));
  };

  const canEditNest = hasPermission('edit_nest');
  const canManageRoles = hasPermission('manage_roles');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col shadow-2xl text-white"
            id="squeak-selector-drawer"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeNest?.color || 'from-zinc-800 to-zinc-900'} flex items-center justify-center text-lg overflow-hidden flex-shrink-0`}>
                  {activeNest?.imageUrl ? (
                    <img src={activeNest.imageUrl} alt={activeNest.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{activeNest?.icon || '🐀'}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono tracking-widest text-amber-500 font-bold uppercase leading-none">NIDO ACTUAL</span>
                  <span className="text-sm font-bold font-sans truncate max-w-[140px] mt-0.5">{activeNest?.name || 'Comunidad'}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channels Lists */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* Nest Management Quick Actions */}
              {activeNest && (
                <div className="space-y-2 bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block">Gubernatura del Nido</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Share Button */}
                    <button
                      onClick={() => {
                        onOpenShareNest();
                        onClose();
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-950 text-zinc-400 hover:text-purple-400 transition-all gap-1 cursor-pointer group"
                      title="Compartir enlace de la comunidad"
                    >
                      <Share2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Compartir</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        if (canEditNest) {
                          onOpenEditNest();
                          onClose();
                        }
                      }}
                      disabled={!canEditNest}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${
                        canEditNest
                          ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-amber-500 cursor-pointer group'
                          : 'bg-zinc-900/20 border-zinc-950/20 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={canEditNest ? "Editar ajustes de la comunidad" : "No tienes permisos para editar"}
                    >
                      <Edit3 className="w-4 h-4 group-hover:scale-105 transition-transform" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Editar</span>
                    </button>

                    {/* Roles Button */}
                    <button
                      onClick={() => {
                        if (canManageRoles) {
                          onOpenManageRoles();
                          onClose();
                        }
                      }}
                      disabled={!canManageRoles}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1 ${
                        canManageRoles
                          ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-emerald-500 cursor-pointer group'
                          : 'bg-zinc-900/20 border-zinc-950/20 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={canManageRoles ? "Gestionar roles de la comunidad" : "No tienes permisos de roles"}
                    >
                      <Shield className="w-4 h-4 group-hover:scale-105 transition-transform" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Roles</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Text Squeaks Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pr-1">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Squeaks (Chat)
                  </span>
                  <button
                    onClick={onOpenCreateSqueak}
                    className="p-1 rounded bg-zinc-900/60 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 transition-all"
                    title="Nuevo Canal de Chat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {textSqueaks.length === 0 ? (
                    <div className="text-zinc-600 text-xs py-2 pl-4 italic">No hay squeaks creados</div>
                  ) : (
                    textSqueaks.map((s) => {
                      const isActive = s.id === activeSqueakId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectSqueak(s.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                            isActive
                              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-semibold'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                          id={`squeak-btn-${s.id}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={isActive ? 'text-black' : 'text-amber-500 group-hover:scale-110 transition-transform'}>»</span>
                            <span className="truncate">{s.name}</span>
                          </div>
                          {isActive && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Voice Squeaks Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pr-1">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Echoes (Canales de Voz)
                  </span>
                </div>
                
                <div className="space-y-1">
                  {voiceSqueaks.length === 0 ? (
                    <div className="text-zinc-600 text-xs py-2 pl-4 italic">No hay ecos acústicos</div>
                  ) : (
                    voiceSqueaks.map((s) => {
                      const isActive = s.id === activeSqueakId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectSqueak(s.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                            isActive
                              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10 font-semibold'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                          id={`squeak-btn-${s.id}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Radio className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-emerald-500 animate-pulse'}`} />
                            <span className="truncate">{s.name}</span>
                          </div>
                          {isActive && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-1 text-[11px] text-zinc-500">
              <div>Modo: <span className="text-zinc-400 font-semibold">Túneles Subterráneos</span></div>
              <div>Red: <span className="text-amber-500/80 font-semibold font-mono">Shrew-Grid Cloud</span></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
