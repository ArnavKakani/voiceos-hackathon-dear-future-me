import nhaLogo from '../../assets/partners/NHA_logo.png';

interface PartnerLogoSlotProps {
  name: string;
  className?: string;
}

const NHA_NAMES = ['NeuroHealth Alliance', 'NeuroHealthAlliance'];

export function PartnerLogoSlot({ name, className = '' }: PartnerLogoSlotProps) {
  if (NHA_NAMES.includes(name)) {
    return (
      <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
        <img
          src={nhaLogo}
          alt="NeuroHealth Alliance"
          className="w-24 h-14 object-contain mx-auto"
        />
        <span className="text-xs font-comfortaa text-[#5D8E67] opacity-70 leading-tight">
          NeuroHealth Alliance
        </span>
      </div>
    );
  }

  // TODO: Add logo assets for additional partners when images are provided
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="w-20 h-12 rounded-xl border-2 border-dashed border-[#9FD89C] bg-[#F9F5ED] flex items-center justify-center">
        <span className="text-[10px] font-comfortaa text-[#5D8E67] opacity-60 text-center px-1 leading-tight">
          Logo Slot
        </span>
      </div>
      <span className="text-xs font-comfortaa text-[#5D8E67] opacity-70 text-center max-w-[80px] leading-tight">
        {name}
      </span>
    </div>
  );
}
