import { useState, useEffect } from 'react';
import { Star, Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpring, useTransform } from 'framer-motion';
import bibLogo from '../assets/icons/Before_It_Breaks_Logo.png';
import { Button } from '../components/ui/Button';
import { AvatarSlot } from '../components/ui/AvatarSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import { BEFORE_IT_BREAKS_URL, gameChoices } from '../data';

interface HealthMeterProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function HealthMeter({ label, value, color, bgColor }: HealthMeterProps) {
  const springWidth = useSpring(0, { stiffness: 80, damping: 18 });
  const widthPct = useTransform(springWidth, (v) => `${v}%`);
  useEffect(() => { springWidth.set(value); }, [value]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-comfortaa font-semibold text-[#5D8E67]">{label}</span>
        <span className="text-xs font-comfortaa text-[#5D8E67]/60">{value}%</span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${bgColor}`}>
        <motion.div className={`h-full rounded-full ${color}`} style={{ width: widthPct }} />
      </div>
    </div>
  );
}

const featureCards = [
  {
    title: 'Built from real student data',
    description: 'Scenarios drawn from 1,109 survey responses about academic pressure, burnout, and what students actually face.',
    accent: 'bg-[#FEE188]/30 border-[#FEE188]',
  },
  {
    title: 'Dynamic well-being meters',
    description: 'Watch your social, mental, and physical health respond to every choice in real time.',
    accent: 'bg-[#9FD89C]/25 border-[#9FD89C]',
  },
  {
    title: 'Reflection after every choice',
    description: 'Pause and ask: why did I choose that? What does that say about what I value right now?',
    accent: 'bg-[#B7E3FF]/30 border-[#B7E3FF]',
  },
];

export function BeforeItBreaksPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const openSimulator = () => window.open(BEFORE_IT_BREAKS_URL, '_blank', 'noopener,noreferrer');

  const currentStats = selected !== null
    ? { social: gameChoices[selected].social, mental: 100 - gameChoices[selected].stress, physical: gameChoices[selected].energy }
    : { social: 70, mental: 65, physical: 75 };

  return (
    <PageWrapper>

      {/* Hero */}
      <motion.section
        className="px-4 sm:px-6 py-16 text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Star className="absolute top-8 left-8 text-[#FEE188] animate-float opacity-50" size={28} fill="#FEE188" />
        <Star className="absolute top-16 right-12 text-[#FEE188] animate-float-slow opacity-40" size={20} fill="#FEE188" />
        <Sparkles className="absolute bottom-12 left-1/4 text-[#9FD89C] animate-sparkle opacity-40" size={16} />

        <div className="flex justify-center mb-4">
          <img src={bibLogo} alt="Before It Breaks" className="h-16 w-auto object-contain" />
        </div>
        <span className="inline-block font-handwriting text-[#5D8E67]/70 text-base mb-4 bg-[#9FD89C]/20 px-4 py-1 rounded-full border border-[#9FD89C]/40">
          a Dear Future Me interactive story
        </span>
        <h1 className="font-comfortaa font-bold text-[#5D8E67] text-5xl sm:text-6xl mb-4 leading-tight">
          Before It Breaks
        </h1>
        <p className="font-comfortaa text-[#5D8E67]/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6">
          Navigate a simulated semester where every choice — classes, sleep, friendships, self-care —
          shapes your well-being in real time.
        </p>
        <p className="font-handwriting text-[#5D8E67]/55 text-lg max-w-xl mx-auto">
          "It doesn't tell you the right answer. It shows you what happens when you choose."
        </p>
      </motion.section>

      {/* Game preview */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Game card */}
            <div className="relative">
              <div className="hidden lg:flex absolute -left-32 top-1/2 -translate-y-1/2 flex-col items-center gap-1">
                <div className="w-px h-12 bg-[#9FD89C]/40" />
                <span className="font-handwriting text-[#5D8E67]/60 text-sm writing-vertical-lr transform rotate-180 whitespace-nowrap">Dynamic Health Meter</span>
              </div>

              <div className="bg-[#F9F5ED] border-2 border-[#5D8E67] rounded-3xl p-6 shadow-card">
                <div className="mb-5 flex gap-3 text-xs font-comfortaa font-semibold justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFD1BD] inline-block" /> Social</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FEE188] inline-block" /> Mental</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B7E3FF] inline-block" /> Physical</span>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <HealthMeter label="Social" value={currentStats.social} color="bg-[#FFD1BD]" bgColor="bg-[#FFD1BD]/20" />
                  <HealthMeter label="Mental" value={currentStats.mental} color="bg-[#FEE188]" bgColor="bg-[#FEE188]/20" />
                  <HealthMeter label="Physical" value={currentStats.physical} color="bg-[#B7E3FF]" bgColor="bg-[#B7E3FF]/20" />
                </div>

                <div className="flex justify-center mb-5">
                  <AvatarSlot size="md" animated />
                </div>

                <div className="bg-[#9FD89C]/15 rounded-2xl p-4 mb-5 text-center">
                  <p className="font-handwriting text-[#5D8E67] text-lg leading-snug">
                    Course registration glows on your laptop.<br />
                    How much are you loading onto this year?
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {gameChoices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`
                        border-2 rounded-2xl px-4 py-3 text-sm font-comfortaa font-semibold transition-all duration-300
                        ${selected === i
                          ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67] scale-[0.99]'
                          : 'border-[#9FD89C] text-[#5D8E67] hover:bg-[#9FD89C]/20 hover:border-[#5D8E67]'
                        }
                      `}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>

                {selected !== null && (
                  <p className="mt-4 text-center font-handwriting text-[#5D8E67]/70 text-base">
                    Notice how the meters shifted. That's you, on paper.
                  </p>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-comfortaa font-bold text-[#5D8E67] text-2xl sm:text-3xl mb-3 leading-tight">
                  This isn't about winning school.
                </h2>
                <p className="font-comfortaa text-[#5D8E67]/70 leading-relaxed">
                  Before It Breaks doesn't tell you the perfect schedule. It shows how every choice has tradeoffs —
                  and how balance is something you can actually practice before the real semester hits.
                </p>
              </div>

              <motion.div
                className="flex flex-col gap-3"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {featureCards.map((card, i) => (
                  <motion.div
                    key={i}
                    className={`rounded-2xl border-2 p-4 ${card.accent}`}
                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.4 }}
                  >
                    <h4 className="font-comfortaa font-bold text-[#5D8E67] text-sm mb-1">{card.title}</h4>
                    <p className="font-comfortaa text-[#5D8E67]/65 text-xs leading-relaxed">{card.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex flex-col gap-3">
                <Button variant="primary" size="lg" onClick={openSimulator}>
                  Enter the Semester
                </Button>
                <Button variant="ghost" size="md" onClick={() => setShowInfo(!showInfo)}>
                  <HelpCircle size={16} className="inline mr-1.5" />
                  How the Game Works
                </Button>
              </div>

              {showInfo && (
                <div className="bg-[#FEE188]/25 border-2 border-[#FEE188] rounded-2xl p-5">
                  <p className="font-comfortaa text-[#5D8E67] text-sm leading-relaxed">
                    Each semester, you make decisions about classes, sleep, social life, and self-care.
                    The dynamic meter updates in real-time to show how those choices affect your three core
                    health areas. At the end, you see the full picture — and what you might do differently.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#9FD89C]/15 border-t border-[#9FD89C]/30 px-4 sm:px-6 py-14 text-center">
        <h3 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-3">
          Ready to see your semester?
        </h3>
        <p className="font-handwriting text-[#5D8E67]/65 text-lg mb-6">
          The game is not here to judge you. It's here to help you notice.
        </p>
        <Button variant="primary" size="lg" onClick={openSimulator}>
          Enter the Semester
        </Button>
      </section>
    </PageWrapper>
  );
}
