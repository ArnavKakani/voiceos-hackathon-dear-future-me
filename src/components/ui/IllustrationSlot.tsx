// Replace with actual illustration PNG/SVG later
interface IllustrationSlotProps {
  label?: string;
  className?: string;
  aspectRatio?: string;
}

export function IllustrationSlot({ label = 'Illustration', className = '', aspectRatio = 'aspect-video' }: IllustrationSlotProps) {
  return (
    /* Replace with illustration PNG/SVG */
    <div className={`${aspectRatio} rounded-2xl border-2 border-dashed border-[#9FD89C] bg-[#F9F5ED] flex items-center justify-center ${className}`}>
      <span className="text-xs font-comfortaa text-[#5D8E67] opacity-50">{label}</span>
    </div>
  );
}
