import { Button } from './Button';
import { Shield } from 'lucide-react';
import { DfmIconSlot } from './DfmIconSlot';

interface SurveyActionCardProps {
  title?: string;
  description?: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function SurveyActionCard({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: SurveyActionCardProps) {
  return (
    <div className="bg-[#F9F5ED] border-2 border-[#9FD89C] rounded-3xl p-8 shadow-soft flex flex-col items-center gap-6 text-center max-w-lg mx-auto">
      <div className="w-28 h-28 rounded-[2rem] border-2 border-[#9FD89C]/60 bg-[#FFFDF8] shadow-[0_10px_26px_rgba(93,142,103,0.12)] flex items-center justify-center">
        <DfmIconSlot variant="logo" size="lg" className="w-20 h-20" />
      </div>

      {title && <h2 className="font-comfortaa font-bold text-[#5D8E67] text-2xl">{title}</h2>}
      {description && (
        <p className="font-handwriting text-[#5D8E67]/80 text-lg leading-relaxed">{description}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <Button variant="primary" size="lg" onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && (
          <Button variant="secondary" size="lg" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs font-comfortaa text-[#5D8E67]/60">
        <Shield size={12} />
        <span>Anonymous &amp; judgment-free</span>
      </div>
    </div>
  );
}
