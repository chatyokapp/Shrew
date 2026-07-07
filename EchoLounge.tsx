import React, { useState, useEffect } from 'react';
import { Squeak, UserProfile, VoiceParticipant } from '../types';
import { Mic, MicOff, PhoneOff, Radio, Sparkles, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EchoLoungeProps {
  squeak: Squeak;
  currentUser: UserProfile;
  onLeave: () => void;
}

const MOCK_PARTICIPANTS_POOL = [
  { name: 'SqueakRacer', color: '#10b981', avatar: '🐭' },
  { name: 'AstroMusaraña', color: '#3b82f6', avatar: '🐿️' },
  { name: 'LofiShrew', color: '#8b5cf6', avatar: '🦫' },
  { name: 'DrTunnel', color: '#ec4899', avatar: '🐇' },
];

export const EchoLounge: React.FC<EchoLoungeProps> = ({
  squeak,
  currentUser,
  onLeave,
}) => {
  const [micMuted, setMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);

  const playEchoSound = () => {
    try {
      // High-quality pop sound MP3 to represent the auditory echo
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
      audio.volume = 0.15;
      audio.play().catch((e) => console.log('Audio play prevented:', e));
    } catch (err) {
      console.log('Audio init error:', err);
    }
  };

  // Initialize participants, including currentUser and some mock active peers
  useEffect(() => {
    const initialParticipants: VoiceParticipant[] = [
      {
        userId: currentUser.id,
        name: currentUser.name,
        avatarColor: currentUser.avatarColor,
        isSpeaking: false,
        joinedAt: Date.now(),
        micMuted: false,
      },
    ];

    // Pick 2-3 random mock participants to populate the space
    const numPeers = Math.floor(Math.random() * 2) + 2; // 2 or 3 peers
    const shuffled = [...MOCK_PARTICIPANTS_POOL].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numPeers; i++) {
      initialParticipants.push({
        userId: `mock-user-${i}`,
        name: shuffled[i].name,
        avatarColor: shuffled[i].color,
        isSpeaking: false,
        joinedAt: Date.now() - Math.random() * 100000,
        micMuted: Math.random() > 0.7, // 30% chance of being muted
      });
    }

    setParticipants(initialParticipants);
  }, [currentUser]);

  // Handle speaker animation loops (simulating dynamic conversational audio)
  useEffect(() => {
    const interval = setInterval(() => {
      let triggeredSound = false;
      
      setParticipants((prev) =>
        prev.map((p) => {
          // If it is the current user, speaking state is controlled by click/hold
          if (p.userId === currentUser.id) {
            return { ...p, isSpeaking, micMuted };
          }
          
          // For other users, randomly toggle speaking state to simulate a lively meeting
          if (p.micMuted) return { ...p, isSpeaking: false };
          
          const wasSpeaking = p.isSpeaking;
          const shouldToggle = Math.random() > 0.75; // 25% change to flip speak state
          const nextSpeaking = shouldToggle ? !wasSpeaking : wasSpeaking;
          
          if (nextSpeaking && !wasSpeaking) {
            triggeredSound = true;
          }
          
          return {
            ...p,
            isSpeaking: nextSpeaking,
          };
        })
      );
      
      if (triggeredSound) {
        playEchoSound();
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isSpeaking, micMuted, currentUser.id]);

  // Floating coordinates for particles/bubbles
  const getCoordinates = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 100; // Radius from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <div 
      className="flex-1 bg-zinc-950 flex flex-col justify-between p-6 select-none relative overflow-hidden"
      id="echo-lounge-screen"
    >
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none" />
      
      {/* Decorative floating grids */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-emerald-400 font-mono tracking-widest font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin-slow" /> ECO ENLACE ACTIVO
            </div>
            <h3 className="text-sm font-bold text-white">Canal: {squeak.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span>{participants.length} Shrews</span>
        </div>
      </div>

      {/* Central Visual Arena (Different Interface) */}
      <div className="flex-1 flex items-center justify-center relative my-4">
        
        {/* Pulsing Central Core */}
        <div className="absolute flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-56 h-56 rounded-full bg-emerald-500/20 blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-80 h-80 rounded-full bg-emerald-400/10 blur-2xl"
          />
          
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shadow-2xl relative">
            <Radio className="w-8 h-8 text-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase mt-1">ECHO CORE</span>
          </div>
        </div>

        {/* Orbiting Shrew Bubbles */}
        <div className="relative w-full h-72 flex items-center justify-center">
          <AnimatePresence>
            {participants.map((p, idx) => {
              const { x, y } = getCoordinates(idx, participants.length);
              const isMe = p.userId === currentUser.id;
              
              return (
                <motion.div
                  key={p.userId}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    x, 
                    y, 
                    opacity: 1, 
                    scale: 1,
                    // Subtle continuous floating
                    translateY: [0, idx % 2 === 0 ? 6 : -6, 0]
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    x: { type: 'spring', damping: 20, stiffness: 80 },
                    y: { type: 'spring', damping: 20, stiffness: 80 },
                    translateY: {
                      duration: 3 + (idx % 3),
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }
                  }}
                  className="absolute z-20"
                >
                  <div className="flex flex-col items-center">
                    
                    {/* Floating Avatar Sphere */}
                    <div className="relative">
                      
                      {/* Ripple Ring when Speaking */}
                      <AnimatePresence>
                        {p.isSpeaking && !p.micMuted && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: 'easeOut',
                            }}
                            className="absolute inset-0 rounded-full blur-[1px]"
                            style={{ border: `3px solid ${p.avatarColor}` }}
                          />
                        )}
                      </AnimatePresence>

                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-300 relative border-2 ${
                          p.isSpeaking && !p.micMuted
                            ? 'scale-110 shadow-lg'
                            : 'scale-100'
                        }`}
                        style={{
                          backgroundColor: `${p.avatarColor}22`,
                          borderColor: p.isSpeaking && !p.micMuted ? p.avatarColor : '#27272a',
                          boxShadow: p.isSpeaking && !p.micMuted ? `0 0 20px ${p.avatarColor}44` : 'none'
                        }}
                      >
                        {isMe ? currentUser.avatarIcon : '🐭'}
                        
                        {/* Muted Indicator */}
                        {p.micMuted && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 border border-zinc-950 flex items-center justify-center text-white text-[10px]">
                            <MicOff className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member name label */}
                    <div className="mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-[9px] font-semibold text-zinc-300 max-w-[80px] truncate text-center">
                      {isMe ? 'Tú' : p.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>

      {/* Control Board */}
      <div className="relative z-10 bg-zinc-900/60 backdrop-blur-md p-4 rounded-3xl border border-zinc-900 flex flex-col gap-3">
        
        {/* Sim Speak Action for User */}
        <div className="flex flex-col items-center justify-center py-2 px-3 bg-zinc-950/40 rounded-2xl border border-zinc-900/40">
          <p className="text-[10px] text-zinc-500 font-medium mb-1.5">MANTÉN PRESIONADO O TOCA PARA HABLAR</p>
          <button
            onMouseDown={() => { if (!micMuted) { setIsSpeaking(true); playEchoSound(); } }}
            onMouseUp={() => setIsSpeaking(false)}
            onTouchStart={() => { if (!micMuted) { setIsSpeaking(true); playEchoSound(); } }}
            onTouchEnd={() => setIsSpeaking(false)}
            onMouseLeave={() => setIsSpeaking(false)}
            className={`w-28 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 border ${
              micMuted
                ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : isSpeaking
                ? 'bg-emerald-500 border-emerald-400 text-black scale-95 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-750 active:scale-98'
            }`}
            disabled={micMuted}
          >
            <Mic className="w-4 h-4" />
            {isSpeaking ? 'Hablando' : 'Transmitir'}
          </button>
        </div>

        {/* Buttons board */}
        <div className="flex gap-3">
          {/* Mute Mic */}
          <button
            onClick={() => {
              setMicMuted(!micMuted);
              if (!micMuted) setIsSpeaking(false);
            }}
            className={`flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center justify-center gap-1.5 ${
              micMuted
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                : 'bg-zinc-850 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
            id="toggle-mic-btn"
          >
            {micMuted ? (
              <>
                <MicOff className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Desmutear</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-zinc-400" />
                <span>Silenciar</span>
              </>
            )}
          </button>

          {/* Leave Voice Room */}
          <button
            onClick={onLeave}
            className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-red-500 border border-zinc-800 hover:border-red-500/30 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
            id="leave-voice-btn"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Colgar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
