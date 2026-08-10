import { motion } from 'framer-motion';

interface StoryCardProps {
  text: string;
  tags: string[];
  color?: 'yellow' | 'peach' | 'softgreen' | 'softblue';
  rotation?: string;
}

const colorBg: Record<string, string> = {
  yellow: 'bg-[#FEE188]/60',
  peach: 'bg-[#FFD1BD]/60',
  softgreen: 'bg-[#9FD89C]/40',
  softblue: 'bg-[#B7E3FF]/50',
};

const tagBg: Record<string, string> = {
  yellow: 'bg-[#FEE188] text-[#5D8E67]',
  peach: 'bg-[#FFD1BD] text-[#5D8E67]',
  softgreen: 'bg-[#9FD89C]/60 text-[#5D8E67]',
  softblue: 'bg-[#B7E3FF] text-[#5D8E67]',
};

export function StoryCard({ text, tags, color = 'yellow', rotation = '0deg' }: StoryCardProps) {
  return (
    <motion.div
      className={`${colorBg[color]} rounded-xl p-5 shadow-card border border-[#F9F5ED]/60`}
      style={{ rotate: parseFloat(rotation) }}
      variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -6, boxShadow: '0 12px 28px rgba(93,142,103,0.18)' }}
    >
      {/* Sticky note pin */}
      <div className="flex justify-end mb-3">
        <div className="w-3 h-3 rounded-full bg-[#5D8E67]/30" />
      </div>
      <p className="font-handwriting text-[#3a5c42] text-lg leading-relaxed mb-4">
        "{text}"
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className={`text-xs font-comfortaa font-semibold px-2.5 py-0.5 rounded-full ${tagBg[color]}`}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
