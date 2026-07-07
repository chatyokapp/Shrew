import React from 'react';
import { Nest } from '../types';
import { Plus, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface NestSelectorProps {
  nests: Nest[];
  activeNestId: string;
  onSelectNest: (nestId: string) => void;
  onOpenCreateNest: () => void;
}

export const NestSelector: React.FC<NestSelectorProps> = ({
  nests,
  activeNestId,
  onSelectNest,
  onOpenCreateNest,
}) => {
  return (
    <div 
      className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/60 p-3 flex items-center justify-between gap-3 overflow-hidden select-none"
      id="nest-selector-bar"
    >
      {/* Scrollable Nests list */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-1 pr-2">
        {/* Special Direct Messages Nest Button */}
        <button
          onClick={() => onSelectNest('dms')}
          className="relative flex-shrink-0 focus:outline-none group"
          id="nest-btn-dms"
        >
          <div
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
              activeNestId === 'dms' 
                ? 'scale-105 shadow-purple-500/10' 
                : 'hover:scale-102 hover:rounded-xl'
            } bg-gradient-to-br from-purple-600 to-indigo-700 text-white`}
          >
            {/* Active Indicator Outer Ring */}
            {activeNestId === 'dms' && (
              <motion.div
                layoutId="activeNestRing"
                className="absolute -inset-1 rounded-[18px] border-2 border-purple-500"
                transition={{ type: 'spring', stiffness: 320, damping: 25 }}
              />
            )}
            
            <MessageSquare className="w-5 h-5 z-10 transform transition-transform group-hover:scale-110" />

            {/* Ambient glow for active */}
            {activeNestId === 'dms' && (
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm pointer-events-none" />
            )}
          </div>

          {/* Mini badge / label for names in scroll bar */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 text-[8px] font-bold text-zinc-300 px-1 rounded border border-zinc-800 pointer-events-none whitespace-nowrap max-w-[48px] truncate">
            Mensajes
          </div>
        </button>

        {nests.map((nest) => {
          const isActive = nest.id === activeNestId;
          return (
            <button
              key={nest.id}
              onClick={() => onSelectNest(nest.id)}
              className="relative flex-shrink-0 focus:outline-none group"
              id={`nest-btn-${nest.id}`}
            >
              <div
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 shadow-md ${
                  isActive 
                    ? 'scale-105 shadow-amber-500/10' 
                    : 'hover:scale-102 hover:rounded-xl'
                } bg-gradient-to-br ${nest.color} overflow-hidden`}
              >
                {/* Active Indicator Outer Ring */}
                {isActive && (
                  <motion.div
                    layoutId="activeNestRing"
                    className="absolute -inset-1 rounded-[18px] border-2 border-amber-500 z-20 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 320, damping: 25 }}
                  />
                )}
                
                {/* Nest icon/emoji or profile picture */}
                {nest.imageUrl ? (
                  <img 
                    src={nest.imageUrl} 
                    alt={nest.name} 
                    className="w-full h-full object-cover z-10" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="z-10 transform transition-transform group-hover:scale-110">
                    {nest.icon}
                  </span>
                )}

                {/* Ambient glow for active */}
                {isActive && (
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm pointer-events-none z-10" />
                )}
              </div>

              {/* Mini badge / label for names in scroll bar */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 text-[8px] font-bold text-zinc-300 px-1 rounded border border-zinc-800 pointer-events-none whitespace-nowrap max-w-[48px] truncate">
                {nest.name}
              </div>
            </button>
          );
        })}

        {/* Add Nest Button */}
        <button
          onClick={onOpenCreateNest}
          className="flex-shrink-0 w-12 h-12 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-500/50 bg-zinc-900/40 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-all duration-300"
          title="Crear un nuevo nido"
          id="create-nest-btn"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Brand logo label on the right */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-900">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 border border-zinc-800">
          <span className="text-sm font-bold text-white font-mono">SR</span>
        </div>
        <div className="hidden xs:block text-right">
          <div className="text-xs font-black text-white font-sans uppercase tracking-widest">Shrew</div>
          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">v1.0</div>
        </div>
      </div>
    </div>
  );
};
