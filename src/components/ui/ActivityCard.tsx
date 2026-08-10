import { IconPlaceholder } from './IconPlaceholder';
import { Button } from './Button';
import { BEFORE_IT_BREAKS_URL } from '../../data';

interface ActivityCardProps {
  id: string;
  title: string;
  prompt: string;
  button: string;
  icon: string;
  accent: 'yellow' | 'peach' | 'softgreen' | 'softblue';
  highlighted?: boolean;
}

const accentBorder: Record<string, string> = {
  yellow: 'border-[#FEE188]',
  peach: 'border-[#FFD1BD]',
  softgreen: 'border-[#9FD89C]',
  softblue: 'border-[#B7E3FF]',
};

const accentBg: Record<string, string> = {
  yellow: 'bg-[#FEE188]/20',
  peach: 'bg-[#FFD1BD]/20',
  softgreen: 'bg-[#9FD89C]/15',
  softblue: 'bg-[#B7E3FF]/20',
};

export function ActivityCard({ id, title, prompt, button, icon, accent, highlighted }: ActivityCardProps) {
  const isGame = id === 'before-it-breaks';

  const handleClick = () => {
    if (isGame) {
      window.open(BEFORE_IT_BREAKS_URL, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  return (
    <div className={`
      relative rounded-2xl border-2 p-6 bg-[#F9F5ED] card-hover cursor-pointer
      ${accentBorder[accent]}
      ${highlighted ? `${accentBg[accent]} ring-2 ring-offset-1 ring-[#5D8E67]/30` : ''}
      flex flex-col gap-4
    `}>
      {highlighted && (
        <span className="absolute -top-2.5 left-4 bg-[#5D8E67] text-[#F9F5ED] text-[10px] font-comfortaa font-bold px-3 py-0.5 rounded-full">
          Recommended for you
        </span>
      )}
      <IconPlaceholder icon={icon} accent={accent} size="lg" />
      <div>
        <h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1">{title}</h3>
        <p className="font-handwriting text-[#5D8E67]/75 text-base leading-snug">{prompt}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={handleClick} className="mt-auto self-start">
        {button}
      </Button>
    </div>
  );
}
