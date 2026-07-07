import React, { useState } from 'react';
import { Plus, X, Globe, Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateNestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string, description: string) => void;
}

const NEST_THEME_GRADIENTS = [
  { name: 'Ocre Fuego', class: 'from-amber-500 to-orange-600' },
  { name: 'Laboratorio', class: 'from-emerald-500 to-teal-600' },
  { name: 'Océano Hondo', class: 'from-cyan-500 to-blue-600' },
  { name: 'Túnel Cósmico', class: 'from-indigo-500 to-purple-600' },
  { name: 'Amanecer', class: 'from-rose-500 to-pink-600' },
];

const EMOJI_OPTIONS = ['🐀', '🐭', '🐹', '🐿️', '🦫', '🌌', '🔬', '🔥', '⛺', '🛸'];

export const CreateNestDialog: React.FC<CreateNestDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🐀');
  const [color, setColor] = useState(NEST_THEME_GRADIENTS[0].class);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('¡Inserta un nombre para el nido!');
      return;
    }
    onCreate(name.trim(), icon, color, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

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

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-white z-50 overflow-hidden"
            id="create-nest-dialog"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Crear Nuevo Nido</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Nido</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej. Squeakers VIP"
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={25}
                />
                {error && <p className="text-red-400 text-[10px]">{error}</p>}
              </div>

              {/* Icon / Emoji selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tótem del Nido</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-all ${
                        icon === emoji 
                          ? 'bg-amber-500 text-black scale-105' 
                          : 'bg-zinc-900 hover:bg-zinc-850'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Gradient Themes */}
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

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="De qué trata este nido subterráneo..."
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={80}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                id="submit-new-nest"
              >
                Crear Nido
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface CreateSqueakDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: 'text' | 'voice', description: string) => void;
}

export const CreateSqueakDialog: React.FC<CreateSqueakDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('¡Inserta un nombre para el squeak!');
      return;
    }
    onCreate(name.trim(), type, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

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

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="absolute bottom-4 left-4 right-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-white z-50 overflow-hidden"
            id="create-squeak-dialog"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Crear Nuevo Squeak</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Canal</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="ej. charlar-de-musarañas"
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={20}
                />
                {error && <p className="text-red-400 text-[10px]">{error}</p>}
              </div>

              {/* Channel Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tipo de Transmisión</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setType('text')}
                    className={`flex-1 p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      type === 'text'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-zinc-900 border-zinc-950 text-zinc-400'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Squeak (Chat)</div>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Mensajería y reacciones rápidas en hilos.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('voice')}
                    className={`flex-1 p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      type === 'voice'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white'
                        : 'bg-zinc-900 border-zinc-950 text-zinc-400'
                    }`}
                  >
                    <Radio className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Echo (Canal de Voz)</div>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Burbujas acústicas flotantes e interactivas.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descripción corta</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuál es el propósito del canal..."
                  className="w-full bg-zinc-900 border border-zinc-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  maxLength={60}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                id="submit-new-squeak"
              >
                Crear Canal
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
