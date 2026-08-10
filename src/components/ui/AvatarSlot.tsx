// TODO: Replace with sprout-envelope mascot or team photo PNG when assets are ready.
// src/assets/team/ and src/assets/illustrations/ are reserved for those files.
interface AvatarSlotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizes = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function AvatarSlot({ size = 'md', className = '', animated = false }: AvatarSlotProps) {
  return (
    /* Replace with sprout-envelope mascot PNG/SVG */
    <div className={`${sizes[size]} ${animated ? 'animate-float' : ''} ${className}`}>
      <div className="w-full h-full rounded-2xl border-2 border-[#5D8E67] bg-[#F9F5ED] flex flex-col items-center justify-center gap-1">
        {/* Sprout envelope placeholder */}
        <svg viewBox="0 0 48 48" className="w-3/5 h-3/5" fill="none" stroke="#5D8E67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="16" width="36" height="26" rx="4" fill="#9FD89C" fillOpacity="0.3" />
          <polyline points="6,16 24,30 42,16" />
          <line x1="24" y1="16" x2="24" y2="8" />
          <path d="M19 8 Q24 2 29 8" />
          <circle cx="24" cy="8" r="1.5" fill="#5D8E67" />
        </svg>
      </div>
    </div>
  );
}
