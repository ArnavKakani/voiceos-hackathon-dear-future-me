import {
  Heart, Compass, Star, Mail, Award, Image, RefreshCw, Feather,
  BookOpen, Pencil, Leaf, Sparkles, Users, Shield, Clock, Play,
  Check, ArrowRight, Gamepad2,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  compass: Compass,
  star: Star,
  mail: Mail,
  award: Award,
  image: Image,
  refresh: RefreshCw,
  feather: Feather,
  book: BookOpen,
  pencil: Pencil,
  leaf: Leaf,
  sparkles: Sparkles,
  users: Users,
  shield: Shield,
  clock: Clock,
  play: Play,
  check: Check,
  arrow: ArrowRight,
  gamepad: Gamepad2,
};

interface IconPlaceholderProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  accent?: 'yellow' | 'peach' | 'softgreen' | 'softblue';
  className?: string;
}

const accentBg: Record<string, string> = {
  yellow: 'bg-[#FEE188]/30',
  peach: 'bg-[#FFD1BD]/40',
  softgreen: 'bg-[#9FD89C]/30',
  softblue: 'bg-[#B7E3FF]/40',
};

const sizes = {
  sm: { wrap: 'w-9 h-9', icon: 16 },
  md: { wrap: 'w-12 h-12', icon: 20 },
  lg: { wrap: 'w-16 h-16', icon: 26 },
};

export function IconPlaceholder({ icon, size = 'md', accent = 'softgreen', className = '' }: IconPlaceholderProps) {
  const Icon = iconMap[icon] ?? Sparkles;
  const { wrap, icon: iconSize } = sizes[size];

  return (
    <div className={`${wrap} rounded-xl ${accentBg[accent]} flex items-center justify-center flex-shrink-0 ${className}`}>
      <Icon size={iconSize} className="text-[#5D8E67]" />
    </div>
  );
}
