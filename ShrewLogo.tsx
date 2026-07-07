import React from 'react';

interface ShrewLogoProps {
  className?: string;
  size?: number;
  withBackground?: boolean;
}

export const ShrewLogo: React.FC<ShrewLogoProps> = ({
  className = '',
  size = 120,
  withBackground = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      id="shrew-logo-container"
    >
      <svg
        id="shrew-svg"
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className="transform transition-transform duration-300 hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle if requested */}
        {withBackground && (
          <circle cx="256" cy="256" r="240" fill="#000000" />
        )}

        {/* Shrew Head Shape (White body background) */}
        <path
          d="M 256,470 
             C 170,440 100,320 120,240 
             C 125,220 128,210 125,180
             C 115,185 100,200 95,215
             C 85,245 92,280 110,310
             C 115,320 112,330 110,340
             C 95,400 130,460 256,480
             C 382,460 417,400 402,340
             C 400,330 397,320 402,310
             C 420,280 427,245 417,215
             C 412,200 397,185 387,180
             C 384,210 387,220 392,240
             C 412,320 342,440 256,470 Z"
          fill="#FFFFFF"
        />

        {/* Inner Main Face Structure */}
        <path
          d="M 256,120 
             C 195,120 150,180 150,250 
             C 150,330 205,395 256,395 
             C 307,395 362,330 362,250 
             C 362,180 317,120 256,120 Z"
          fill="#FFFFFF"
        />

        {/* Left Ear */}
        <path
          d="M 180,140 
             C 150,110 110,130 110,170 
             C 110,210 145,230 170,220
             C 165,190 170,165 180,140 Z"
          fill="#FFFFFF"
        />
        {/* Left Ear Inner Detail (Black swirl) */}
        <path
          d="M 160,160 
             C 145,145 125,155 125,175 
             C 125,195 145,205 160,195
             C 155,185 155,175 160,160 Z"
          fill="#000000"
        />

        {/* Right Ear */}
        <path
          d="M 332,140 
             C 362,110 402,130 402,170 
             C 402,210 367,230 342,220
             C 347,190 342,165 332,140 Z"
          fill="#FFFFFF"
        />
        {/* Right Ear Inner Detail (Black swirl) */}
        <path
          d="M 352,160 
             C 367,145 387,155 387,175 
             C 387,195 367,205 352,195
             C 357,185 357,175 352,160 Z"
          fill="#000000"
        />

        {/* Neck Black Shadow Cut (The sharp bottom collar/v-neck) */}
        <path
          d="M 160,320 
             C 210,360 240,430 256,450 
             C 272,430 302,360 352,320 
             C 300,370 270,390 256,390 
             C 242,390 212,370 160,320 Z"
          fill="#000000"
        />

        {/* Cheek Outlines / Curving frames to give the distinctive shrew muzzle definition */}
        <path
          d="M 118,272
             C 130,340 180,380 256,380
             C 332,380 382,340 394,272
             C 380,355 320,396 256,396
             C 192,396 132,355 118,272 Z"
          fill="#000000"
        />

        {/* Left Eye */}
        <circle cx="186" cy="235" r="18" fill="#000000" />
        <circle cx="181" cy="230" r="5" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="326" cy="235" r="18" fill="#000000" />
        <circle cx="321" cy="230" r="5" fill="#FFFFFF" />

        {/* Snout lines / Nose Bridge */}
        <path
          d="M 222,238 C 228,260 242,290 248,310"
          stroke="#000000"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 290,238 C 284,260 270,290 264,310"
          stroke="#000000"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Nose */}
        <ellipse cx="256" cy="320" rx="24" ry="17" fill="#000000" />
        <ellipse cx="250" cy="315" rx="7" ry="4" fill="#FFFFFF" opacity="0.8" />

        {/* Cute Smile / Mouth lines */}
        <path
          d="M 215,325 
             C 230,350 250,355 256,355 
             C 262,355 282,350 297,325"
          stroke="#000000"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Whiskers Left (3 distinct lines curving outwards) */}
        {/* Top Whisker */}
        <path
          d="M 190,290 C 140,270 100,275 64,278"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Middle Whisker */}
        <path
          d="M 195,304 C 145,295 90,300 68,328"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Bottom Whisker */}
        <path
          d="M 205,318 C 150,318 115,340 92,382"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Whiskers Right (3 distinct lines curving outwards) */}
        {/* Top Whisker */}
        <path
          d="M 322,290 C 372,270 412,275 448,278"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Middle Whisker */}
        <path
          d="M 317,304 C 367,295 422,300 444,328"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Bottom Whisker */}
        <path
          d="M 307,318 C 362,318 397,340 420,382"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
