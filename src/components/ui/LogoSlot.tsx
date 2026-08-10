import dfmLogo from '../../assets/icons/dfm_logo_main.png';

interface LogoSlotProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export function LogoSlot({ size = 'md', className = '', showText = true }: LogoSlotProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={dfmLogo}
        alt="Dear Future Me"
        className={`${sizes[size]} object-contain flex-shrink-0`}
      />
      {showText && (
        <span className="font-comfortaa font-bold text-[#5D8E67] leading-none text-sm whitespace-nowrap">
          Dear Future Me
        </span>
      )}
    </div>
  );
}
