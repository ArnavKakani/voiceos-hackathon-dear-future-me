interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-comfortaa font-semibold border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#5D8E67] focus:ring-offset-1
        ${active
          ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]'
          : 'bg-[#F9F5ED] text-[#5D8E67] border-[#9FD89C] hover:bg-[#9FD89C]/25'
        }
      `}
    >
      {label}
    </button>
  );
}
