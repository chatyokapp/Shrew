import React, { useState, useEffect } from 'react';
import { Nest, Role, UserProfile } from '../types';
import { X, Shield, Plus, Trash2, Check, Copy, Share2, Users, Edit3, Palette, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { listenToAllUsers, updateNest } from '../firebase';

interface EditNestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nest: Nest;
}

const NEST_THEME_GRADIENTS = [
  { name: 'Ocre Fuego', class: 'from-amber-500 to-orange-600' },
  { name: 'Laboratorio', class: 'from-emerald-500 to-teal-600' },
  { name: 'Océano Hondo', class: 'from-cyan-500 to-blue-600' },
  { name: 'Túnel Cósmico', class: 'from-indigo-500 to-purple-600' },
  { name: 'Amanecer', class: 'from-rose-500 to-pink-600' },
];

const EMOJI_OPTIONS = ['🐀', '🐭', '🐹', '🐿️', '🦫', '🌌', '🚀', '🛠️', '🍄', '🪵', '🍂', '🍁'];

export const EditNestDialog: React.FC<EditNestDialogProps> = ({
  isOpen,
  onClose,
  nest,
}) => {
  const [name, setName] = useState(nest.name);
  const [icon, setIcon] = useState(nest.icon);
  const [color, setColor] = useState(nest.color);
  const [description, setDescription] = useState(nest.description || '');
  const [imageUrl, setImageUrl] = useState(nest.imageUrl || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(nest.name);
    setIcon(nest.icon);
    setColor(nest.color);
    setDescription(nest.description || '');
    setImageUrl(nest.imageUrl || '');
  }, [nest]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setError('La foto de perfil debe ser menor a 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('¡Inserta un nombre para el nido!');
      return;
    }
    try {
      await updateNest(nest.id, {
        name: name.trim(),
        icon,
        color,
        description: description.trim(),
        imageUrl: imageUrl,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError('Error al actualizar el nido');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-white z-50 overflow-hidden"
            id="edit-nest-dialog"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Editar Comunidad Shrew</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pb-2">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-4 bg-zinc-900/30 p-3.5 rounded-2xl border border-zinc-900">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl relative overflow-hidden flex-shrink-0 border border-zinc-850 shadow-md`}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="z-10">{icon}</span>
                  )}
                  <div className="absolute inset-0 bg-black/10 rounded-2xl pointer-events-none" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Foto de Perfil</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      Subir Imagen
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="bg-red-950/20 hover:bg-red-900/20 text-red-400 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-900/30 transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Nido</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={25}
                />
                {error && <p className="text-red-400 text-[10px]">{error}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tótem por Defecto</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcon(emoji);
                        setImageUrl('');
                      }}
                      className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-all ${
                        (!imageUrl && icon === emoji) 
                          ? 'bg-amber-500 text-black scale-105' 
                          : 'bg-zinc-900 hover:bg-zinc-850'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Paleta de Aura</label>
                <div className="flex gap-2">
                  {NEST_THEME_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient.class}
                      type="button"
                      onClick={() => setColor(gradient.class)}
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient.class} relative flex items-center justify-center transition-transform hover:scale-105`}
                      title={gradient.name}
                    >
                      {color === gradient.class && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={80}
                />
              </div>

              <button
                type="submit"
                disabled={success}
                className={`w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  success 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
                }`}
              >
                {success ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" /> ¡Guardado con éxito!
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface ManageRolesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nest: Nest;
}

const ROLE_COLORS = [
  { hex: '#ef4444', label: 'Rojo' },
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#10b981', label: 'Verde' },
  { hex: '#f59e0b', label: 'Ámbar' },
  { hex: '#8b5cf6', label: 'Morado' },
  { hex: '#ec4899', label: 'Rosa' },
];

export const ManageRolesDialog: React.FC<ManageRolesDialogProps> = ({
  isOpen,
  onClose,
  nest,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'members'>('roles');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  // Create role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0].hex);
  const [newRolePerms, setNewRolePerms] = useState<string[]>(['send_messages']);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = listenToAllUsers((loadedUsers) => {
        setAllUsers(loadedUsers);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setError('¡Ingresa un nombre para el rol!');
      return;
    }
    
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      permissions: newRolePerms,
    };

    const updatedRoles = [...(nest.roles || []), newRole];
    await updateNest(nest.id, { roles: updatedRoles });
    
    setNewRoleName('');
    setError('');
  };

  const handleDeleteRole = async (roleId: string) => {
    const updatedRoles = (nest.roles || []).filter((r) => r.id !== roleId);
    
    // Also clean up assigned member roles
    const updatedMemberRoles = { ...(nest.memberRoles || {}) };
    for (const userId of Object.keys(updatedMemberRoles)) {
      updatedMemberRoles[userId] = (updatedMemberRoles[userId] || []).filter((id) => id !== roleId);
    }

    await updateNest(nest.id, { 
      roles: updatedRoles,
      memberRoles: updatedMemberRoles
    });
  };

  const togglePermission = (perm: string) => {
    if (newRolePerms.includes(perm)) {
      setNewRolePerms(newRolePerms.filter((p) => p !== perm));
    } else {
      setNewRolePerms([...newRolePerms, perm]);
    }
  };

  const handleToggleUserRole = async (userId: string, roleId: string) => {
    const userRoles = nest.memberRoles?.[userId] || [];
    let updated: string[];
    if (userRoles.includes(roleId)) {
      updated = userRoles.filter((id) => id !== roleId);
    } else {
      updated = [...userRoles, roleId];
    }

    const updatedMemberRoles = {
      ...(nest.memberRoles || {}),
      [userId]: updated
    };

    await updateNest(nest.id, { memberRoles: updatedMemberRoles });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="absolute top-14 bottom-4 left-4 right-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 shadow-2xl text-white z-50 flex flex-col overflow-hidden"
            id="manage-roles-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Roles del Nido</h3>
                  <p className="text-[9px] text-zinc-500">{nest.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-2 mb-3 bg-zinc-900/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('roles')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'roles' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Definir Roles
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'members' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Asignar a Miembros
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
              {activeTab === 'roles' ? (
                <div className="space-y-4">
                  {/* Create Role Form */}
                  <form onSubmit={handleCreateRole} className="bg-zinc-900/40 border border-zinc-900/50 p-3.5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Crear Rol Personalizado
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Rol</label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => {
                          setNewRoleName(e.target.value);
                          setError('');
                        }}
                        placeholder="Ej. Moderador, Curador, VIP"
                        className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                        maxLength={15}
                      />
                      {error && <p className="text-red-400 text-[10px]">{error}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Color Distintivo</label>
                      <div className="flex gap-2 flex-wrap">
                        {ROLE_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setNewRoleColor(c.hex)}
                            className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center transition-transform hover:scale-110 relative"
                            style={{ backgroundColor: c.hex }}
                          >
                            {newRoleColor === c.hex && (
                              <Check className="w-3.5 h-3.5 text-black stroke-[3] drop-shadow" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Permisos de Aura</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'send_messages', label: 'Escribir Chats' },
                          { id: 'manage_channels', label: 'Crear Squeaks' },
                          { id: 'edit_nest', label: 'Editar Nido' },
                          { id: 'manage_roles', label: 'Crear Roles' },
                        ].map((p) => {
                          const isSelected = newRolePerms.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePermission(p.id)}
                              className={`p-2 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                  : 'bg-zinc-900/60 border-zinc-950 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded flex items-center justify-center border ${
                                isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-700'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                              </div>
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all"
                    >
                      Crear e Introducir Rol
                    </button>
                  </form>

                  {/* Existing Roles List */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Roles Existentes</label>
                    {(nest.roles || []).length === 0 ? (
                      <div className="text-zinc-600 text-xs py-4 pl-4 italic border border-dashed border-zinc-900 rounded-2xl bg-zinc-900/10 text-center">
                        Ningún rol creado todavía
                      </div>
                    ) : (
                      (nest.roles || []).map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-900"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: role.color }} />
                            <div>
                              <span className="text-xs font-bold" style={{ color: role.color }}>{role.name}</span>
                              <div className="flex gap-1 flex-wrap mt-0.5">
                                {(role.permissions || []).map((p) => (
                                  <span key={p} className="text-[7px] font-mono uppercase bg-zinc-900 text-zinc-500 px-1 py-0.5 rounded border border-zinc-800">
                                    {p === 'send_messages' ? 'Mensajear' : p === 'manage_channels' ? 'Canales' : p === 'edit_nest' ? 'Config' : 'Roles'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1.5 rounded-lg bg-red-950/20 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                            title="Eliminar Rol"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Members Tab */
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 italic px-1 mb-2">Asigna los roles creados a cualquier miembro del Túnel:</p>
                  
                  {allUsers.map((user) => {
                    const userRoleIds = nest.memberRoles?.[user.id] || [];
                    return (
                      <div
                        key={user.id}
                        className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col gap-2.5"
                      >
                        {/* Member Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border border-zinc-800"
                              style={{ backgroundColor: `${user.avatarColor}15` }}
                            >
                              {user.avatarIcon}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                                {user.name}
                                {user.id === nest.ownerId && (
                                  <span className="text-[7px] font-mono bg-amber-500/10 text-amber-500 px-1 rounded border border-amber-500/20">OWNER</span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-500">@{user.username}</div>
                            </div>
                          </div>
                        </div>

                        {/* Roles Selection Grid */}
                        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-zinc-900/60">
                          {(nest.roles || []).length === 0 ? (
                            <span className="text-[9px] text-zinc-600 italic">No hay roles definidos en la comunidad</span>
                          ) : (
                            (nest.roles || []).map((role) => {
                              const hasRole = userRoleIds.includes(role.id);
                              return (
                                <button
                                  key={role.id}
                                  onClick={() => handleToggleUserRole(user.id, role.id)}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 border ${
                                    hasRole
                                      ? 'bg-zinc-900 border-zinc-700 font-semibold'
                                      : 'bg-zinc-950/60 border-zinc-950 text-zinc-500 hover:text-zinc-400'
                                  }`}
                                  style={{ color: hasRole ? role.color : undefined }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.color }} />
                                  {role.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface ShareCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nest: Nest;
}

export const ShareCommunityDialog: React.FC<ShareCommunityDialogProps> = ({
  isOpen,
  onClose,
  nest,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState(nest.inviteCode || '');

  useEffect(() => {
    if (isOpen && !nest.inviteCode) {
      // Generate a truly random, unique 6-character alphanumeric string prefix with shr-
      const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `shr-${randStr}`;
      setInviteCode(code);
      // Persist in database
      updateNest(nest.id, { inviteCode: code }).catch((err) => {
        console.warn('Failed to update invite code in Firestore:', err);
      });
    } else if (nest.inviteCode) {
      setInviteCode(nest.inviteCode);
    }
  }, [isOpen, nest.id, nest.inviteCode]);

  const shareLink = `shrw.gg/n/${inviteCode || nest.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-white z-50 overflow-hidden"
            id="share-nest-dialog"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Compartir Comunidad</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview Card */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-2xl flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${nest.color} flex items-center justify-center text-xl`}>
                  {nest.icon}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{nest.name}</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5 truncate max-w-[220px]">
                    {nest.description || 'Comunidad en la red Shrew'}
                  </p>
                </div>
              </div>

              {/* Share link input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Enlace del Nido</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-zinc-900 border border-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-amber-500 font-mono font-bold truncate">
                    {shareLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      copied 
                        ? 'bg-emerald-500 text-black scale-102' 
                        : 'bg-zinc-900 hover:bg-zinc-850 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <p className="text-[8px] text-zinc-500 leading-normal">
                  Cualquier musaraña que reciba este enlace podrá entrar instantáneamente al nido escribiendo el link en el buscador o teleportador del túnel.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
