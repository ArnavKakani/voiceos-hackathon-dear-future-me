interface StatCardProps {
  value: string;
  label: string;
  accent?: 'yellow' | 'peach' | 'softgreen' | 'softblue';
}

const accentMap = {
  yellow: 'bg-[#FEE188]/50 border-[#FEE188]',
  peach: 'bg-[#FFD1BD]/50 border-[#FFD1BD]',
  softgreen: 'bg-[#9FD89C]/30 border-[#9FD89C]',
  softblue: 'bg-[#B7E3FF]/40 border-[#B7E3FF]',
};

export function StatCard({ value, label, accent = 'softgreen' }: StatCardProps) {
  return (
    <div className={`rounded-2xl border-2 ${accentMap[accent]} p-5 text-center card-hover`}>
      <div className="text-3xl font-comfortaa font-bold text-[#5D8E67] mb-1">{value}</div>
      <div className="text-sm font-comfortaa text-[#5D8E67]/80 leading-snug">{label}</div>
    </div>
  );
}
