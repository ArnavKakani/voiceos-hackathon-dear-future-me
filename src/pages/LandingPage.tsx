import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkles, ArrowRight, ArrowUpRight, Pencil, Mic } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import { VoiceOrb } from '../components/ui/VoiceOrb';
import { PageWrapper } from '../components/layout/PageWrapper';
import { BEFORE_IT_BREAKS_URL, stories, gameChoices } from '../data';
import supabase from '../supabase/client';

// ─── Mini components used only on the landing page ───────────────────────────

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 40, damping: 15 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString() + suffix);
  useEffect(() => { count.set(target); }, [target]);
  return <motion.span>{display}</motion.span>;
}

function HandwrittenLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-handwriting text-[#5D8E67]/55 text-3xl flex items-center gap-1 select-none ${className}`}>
      {children}
    </span>
  );
}

function PinDot({ color = 'bg-[#5D8E67]' }: { color?: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />;
}

function StickyNote({
  text,
  rotate = '0deg',
  color = 'bg-[#FEE188]/70',
  className = '',
}: {
  text: string;
  rotate?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`${color} rounded-lg px-4 py-3 shadow-sm border border-[#F9F5ED]/50 card-hover cursor-default max-w-[220px] ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      <PinDot color="bg-[#5D8E67]/30" />
      <p className="font-handwriting text-[#3a5c42] text-lg leading-snug mt-1.5">{text}</p>
    </div>
  );
}

function MiniMeter({ label, value, barColor }: { label: string; value: number; barColor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-[10px] font-comfortaa font-semibold text-[#5D8E67]/70">{label}</span>
        <span className="text-[10px] font-comfortaa text-[#5D8E67]/50">{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#9FD89C]/20">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const [gameChoice, setGameChoice] = useState<number | null>(null);
  const [communityNotes, setCommunityNotes] = useState<string[]>([]);
  const [communityLoaded, setCommunityLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('testimonial_content')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCommunityNotes(data.map((r) => (r.testimonial_content as string) ?? ''));
        }
        setCommunityLoaded(true);
      });
  }, []);

  const meters = gameChoice !== null
    ? { social: gameChoices[gameChoice].social, mental: 100 - gameChoices[gameChoice].stress, physical: gameChoices[gameChoice].energy }
    : { social: 70, mental: 65, physical: 75 };

  const openBeforeItBreaks = () => {
    window.open(BEFORE_IT_BREAKS_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          ABOVE THE FOLD — THE DESK COMPOSITION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-10 py-8 lg:py-10 flex flex-col items-center">

        {/* ── Background floating decoration ── */}
        <Star className="absolute top-6 right-24 text-[#FEE188] animate-float opacity-50 pointer-events-none" size={30} fill="#FEE188" />
        <Star className="absolute top-28 left-6 text-[#FEE188] animate-float-slow opacity-35 pointer-events-none" size={18} fill="#FEE188" />
        <Star className="absolute bottom-20 right-6 text-[#FEE188] animate-float-delayed opacity-30 pointer-events-none" size={22} fill="#FEE188" />
        <Sparkles className="absolute top-12 left-1/3 text-[#9FD89C] animate-sparkle opacity-30 pointer-events-none" size={14} />
        <Sparkles className="absolute bottom-32 left-1/4 text-[#FFD1BD] animate-sparkle opacity-35 pointer-events-none" size={12} />

        {/* Soft background blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#9FD89C]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-60 rounded-full bg-[#FFD1BD]/10 blur-3xl pointer-events-none" />

        {/* ── GRID: main desk composition ── */}
        <div className="max-w-[920px] w-full mx-auto relative">

          {/* TOP ROW */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-7 items-start justify-center">

            {/* ─── LEFT: Open Letter / Notebook Page ─── */}
            <div className="relative w-full lg:w-[560px] lg:flex-none min-w-0">

              {/* "start here" annotation */}
              <div className="absolute -top-10 left-8 flex items-center gap-1 z-10">
                <HandwrittenLabel>
                  <Pencil size={11} /> start here
                </HandwrittenLabel>
              </div>

              {/* The open letter card */}
              <div className="relative bg-[#FDFAF3] border border-[#d4c99a]/60 rounded-2xl shadow-[0_8px_40px_rgba(93,142,103,0.13)] overflow-hidden">
                {/* Red margin line */}
                <div className="absolute left-14 top-0 bottom-0 w-px bg-[#FFD1BD]/60 pointer-events-none" />
                {/* Hole punches */}
                <div className="absolute left-5 top-8 w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
                <div className="absolute left-5 top-20 w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
                <div className="absolute left-5 top-32 w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
                {/* Lined paper */}
                <div className="bg-lined pl-16 pr-6 pt-8 pb-8">
                  <p className="font-handwriting text-[#5D8E67]/60 text-4xl mb-5 tracking-wide">Dear Future Me,</p>

                  <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight mb-5">
                    You are <span className="relative inline-block">
                      more than
                      <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 120 8" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4 Q80 3 118 8" stroke="#FEE188" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      </svg>
                    </span><br />
                    what you're trying<br />to prove.
                  </h1>

                  <p className="font-comfortaa text-[#5D8E67]/70 text-base leading-relaxed mb-6 max-w-sm">
                    This is a space to pause, breathe, and remember who you are beyond your GPA, your college applications, and the pressure you carry every day.
                  </p>

                  <p className="font-comfortaa text-[#5D8E67]/55 text-base sm:text-[1.02rem] leading-relaxed mb-8 italic max-w-md">
                    "Built for the student who looks fine on paper but feels overwhelmed inside."
                  </p>

                  {/* CTA row — not centered, left-aligned */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="primary" size="md" onClick={() => navigate('/check-in')}>
                      Start Reflection
                    </Button>
                    <button
                      onClick={() => navigate('/explore')}
                      className="font-comfortaa text-sm text-[#5D8E67]/70 hover:text-[#5D8E67] flex items-center gap-1 transition-colors"
                    >
                      Explore activities <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ─── RIGHT: Vertical stack of portal cards ─── */}
            <div className="relative flex flex-col justify-between gap-4 w-full lg:w-[280px] flex-shrink-0 mt-6 lg:mt-0 lg:pt-20 lg:min-h-[520px]">

              {/* "what are you carrying?" annotation */}
              <HandwrittenLabel className="lg:absolute lg:top-8 lg:left-8">
                what are you carrying?
              </HandwrittenLabel>

              {/* CHECK IN CARD */}
              <div
                className="relative bg-[#FFD1BD]/30 border-2 border-[#FFD1BD] rounded-2xl p-5 card-hover cursor-pointer group"
                onClick={() => navigate('/check-in')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/check-in')}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-comfortaa font-bold text-[#5D8E67]/50 uppercase tracking-widest">Step 1</span>
                  <ArrowUpRight size={16} className="text-[#5D8E67]/40 group-hover:text-[#5D8E67] transition-colors" />
                </div>
                <h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1.5">Check In</h3>
                <p className="font-comfortaa text-[#5D8E67]/70 text-[15px] leading-relaxed">
                  A moment to notice what you're carrying before anything else.
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 ? 'bg-[#5D8E67]/30' : 'bg-[#5D8E67]/10'}`} />
                  ))}
                  <span className="text-[10px] font-comfortaa text-[#5D8E67]/40 ml-1">2 min</span>
                </div>
              </div>

              {/* STORIES CARD */}
              <div
                className="relative bg-[#B7E3FF]/30 border-2 border-[#B7E3FF] rounded-2xl p-5 card-hover cursor-pointer group"
                onClick={() => navigate('/stories')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/stories')}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-comfortaa font-bold text-[#5D8E67]/50 uppercase tracking-widest">Community</span>
                  <ArrowUpRight size={16} className="text-[#5D8E67]/40 group-hover:text-[#5D8E67] transition-colors" />
                </div>
                {/* Mini story previews */}
                <div className="flex flex-col gap-2 mb-3">
                  {stories.slice(0, 2).map((s) => (
                    <div key={s.id} className="bg-[#F9F5ED]/80 rounded-lg px-3 py-2.5">
                      <p className="font-comfortaa text-[#5D8E67]/80 text-[13px] leading-relaxed line-clamp-2">"{s.text}"</p>
                    </div>
                  ))}
                </div>
                <HandwrittenLabel>
                  you're not the only one →
                </HandwrittenLabel>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW: impact receipt + floating notes ── */}
          <div className="flex flex-col sm:flex-row gap-5 mt-8 lg:mt-10 items-start">

            {/* Impact receipt — stamped, receipt-like, left-offset */}
            <div className="relative sm:ml-16 lg:ml-24">
              <HandwrittenLabel className="mb-2">proof this helped</HandwrittenLabel>
              <div className="bg-[#F9F5ED] border border-[#d4c99a]/60 rounded-xl shadow-card overflow-hidden w-56">
                {/* Receipt header */}
                <div className="bg-[#5D8E67] px-4 py-2 flex items-center justify-between">
                  <span className="font-comfortaa font-bold text-[#F9F5ED] text-xs uppercase tracking-wider">Field Notes</span>
                  <span className="font-handwriting text-[#9FD89C] text-xs">2023–2026</span>
                </div>
                {/* Dashed divider */}
                <div className="border-t border-dashed border-[#d4c99a]/50 mx-3" />
                {/* Receipt lines */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  {[
                    { target: 26, lbl: 'schools reached' },
                    { target: 720, lbl: 'workshop attendees' },
                  ].map((item) => (
                    <div key={item.lbl} className="flex justify-between items-baseline gap-3">
                      <span className="font-comfortaa text-[10px] text-[#5D8E67]/60 leading-none">{item.lbl}</span>
                      <span className={`font-comfortaa font-bold text-[#5D8E67] tabular-nums ${item.lbl === 'schools reached' ? 'text-lg' : 'text-sm'}`}>
                        <CountUp target={item.target} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-[#d4c99a]/50 mx-3" />
                {/* Anxiety reduction — prominent */}
                <div className="px-4 py-3 bg-[#9FD89C]/20">
                  <p className="font-comfortaa text-[9px] text-[#5D8E67]/60 mb-1 uppercase tracking-wider">avg. anxiety score</p>
                  <div className="flex items-center justify-between">
                    <span className="font-comfortaa font-bold text-[#5D8E67] text-base tabular-nums">3.95 → 3.32</span>
                    <span className="font-handwriting text-[#5D8E67]/60 text-xs">after reflection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating sticky notes cluster */}
            <div className="flex-1 relative min-h-[260px] hidden sm:block">
              {/* Arrow annotation — positioned so arrow tip lands near first note */}
              <div className="absolute top-0 left-6 flex items-center gap-1.5">
                <HandwrittenLabel>anonymous student notes</HandwrittenLabel>
                <svg width="36" height="44" viewBox="0 0 36 44" className="text-[#5D8E67]/30">
                  <path d="M2 4 Q10 4 18 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M15 38 L18 36 L20 39" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <StickyNote
                text="I thought everyone else had it figured out. They didn't."
                rotate="1.5deg"
                color="bg-[#9FD89C]/50"
                className="absolute top-14 left-4"
              />
              <StickyNote
                text="Sleeping before midnight felt rebellious."
                rotate="-2deg"
                color="bg-[#FEE188]/70"
                className="absolute top-10 left-52"
              />
              <StickyNote
                text="Rest isn't a reward I have to earn."
                rotate="2.5deg"
                color="bg-[#FFD1BD]/70"
                className="absolute top-40 left-28"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BEFORE IT BREAKS — FEATURED PORTAL
      ══════════════════════════════════════════════════════════════════ */}
      <section id="before-it-breaks-section" className="px-4 sm:px-6 lg:px-10 py-20 bg-[#5D8E67] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.07] pointer-events-none" />
        <Star className="absolute top-10 right-20 text-[#FEE188] animate-float opacity-35 pointer-events-none" size={28} fill="#FEE188" />
        <Star className="absolute bottom-14 left-10 text-[#FEE188] animate-float-slow opacity-25 pointer-events-none" size={20} fill="#FEE188" />

        <motion.div
          className="max-w-6xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">

            {/* Left: copy */}
            <div className="flex-1 min-w-0">
              <HandwrittenLabel className="mb-3 text-[#9FD89C]/70">a dear future me interactive story</HandwrittenLabel>
              <h2 className="font-comfortaa font-bold text-[#F9F5ED] text-4xl sm:text-5xl mb-5 leading-tight">
                Before It Breaks
              </h2>
              <p className="font-comfortaa text-[#F9F5ED]/75 text-lg leading-relaxed mb-6 max-w-md">
                Navigate a simulated semester where every choice — classes, sleep, friendships, self-care — shapes your well-being meter in real time.
              </p>
              <p className="font-handwriting text-[#9FD89C]/80 text-xl mb-8 leading-relaxed">
                "It doesn't tell you the right answer. It shows you what happens when you choose."
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={openBeforeItBreaks}
                  className="bg-[#FEE188] border-[#FEE188] text-[#5D8E67] hover:bg-[#fad96a] hover:border-[#fad96a]"
                >
                  Enter the Semester
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={openBeforeItBreaks}
                  className="border-[#F9F5ED]/30 text-[#F9F5ED] hover:bg-[#F9F5ED]/10"
                >
                  Open Simulator
                </Button>
              </div>
            </div>

            {/* Right: interactive game widget */}
            <div className="relative flex-shrink-0 w-full sm:w-[340px]">
              <HandwrittenLabel className="mb-2 text-[#9FD89C]/70">
                <Pencil size={11} /> tap a choice to see the meters shift
              </HandwrittenLabel>

              <div className="bg-[#F9F5ED] border-2 border-[#F9F5ED]/30 rounded-3xl p-5 shadow-[0_12px_48px_rgba(0,0,0,0.25)]">
                <div className="flex gap-3 justify-center mb-4 text-[10px] font-comfortaa font-semibold text-[#5D8E67]/70">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFD1BD] inline-block" />Social</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FEE188] inline-block" />Mental</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B7E3FF] inline-block" />Physical</span>
                </div>

                <div className="flex flex-col gap-2.5 mb-5">
                  <MiniMeter label="Social" value={meters.social} barColor="bg-[#FFD1BD]" />
                  <MiniMeter label="Mental" value={meters.mental} barColor="bg-[#FEE188]" />
                  <MiniMeter label="Physical" value={meters.physical} barColor="bg-[#B7E3FF]" />
                </div>

                <div className="bg-[#9FD89C]/15 rounded-xl p-3 mb-4 text-center">
                  <p className="font-handwriting text-[#5D8E67] text-base leading-snug">
                    Course registration glows on your laptop.<br />
                    How much are you loading onto this year?
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {gameChoices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => setGameChoice(i)}
                      className={`border-2 rounded-xl px-4 py-2.5 text-sm font-comfortaa font-semibold transition-all duration-300
                        ${gameChoice === i
                          ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]'
                          : 'border-[#9FD89C]/60 text-[#5D8E67] hover:border-[#5D8E67] hover:bg-[#9FD89C]/15'
                        }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>

                {gameChoice !== null && (
                  <p className="mt-3 text-center font-handwriting text-[#5D8E67]/55 text-sm">
                    Notice how the meters shifted. That's you, on paper.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          DFM VOICE — FEATURED PORTAL

          Colour: PEACH (#FFD1BD-tinted cream). It sits directly under the solid
          dark-green Before It Breaks band, so the two must not read as one
          block. A light-green (#9FD89C) treatment was the other option, but on
          this page it loses twice: it reads as a washed-out continuation of the
          green band above, and the orb — which is itself soft green — has
          nothing to sit against. Peach alternates warm after cool, keeps the
          orb the only green thing in the band, and stays clear of the
          #FEE188/15 final CTA two sections down.
          Light-green alternative: bg-[#9FD89C]/15 + border-[#9FD89C]/30 + pill bg-[#FEE188]/40.
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-10 py-16 bg-[#FFD1BD]/25 border-y border-[#FFD1BD]/60 relative overflow-hidden">
        <Sparkles className="absolute top-10 left-1/4 text-[#FFD1BD] animate-sparkle opacity-60 pointer-events-none" size={16} />
        <Star className="absolute bottom-12 right-16 text-[#FEE188] animate-float-slow opacity-40 pointer-events-none" size={20} fill="#FEE188" />

        <motion.div
          className="max-w-5xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col-reverse sm:flex-row items-center gap-8 sm:gap-12">

            {/* Copy */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5D8E67] text-[#F9F5ED] font-comfortaa font-bold text-[10px] uppercase tracking-widest mb-4">
                <Mic size={10} /> New
              </span>
              <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-3 leading-tight">
                DFM Voice
              </h2>
              <p className="font-handwriting text-[#5D8E67]/65 text-2xl mb-5 leading-snug max-w-md mx-auto sm:mx-0">
                tap the widget, start talking — future you keeps every word.
              </p>
              <p className="font-comfortaa text-[#5D8E67]/70 text-base leading-relaxed mb-6 max-w-md mx-auto sm:mx-0">
                A voice-first iPhone app and companion that writes straight into this
                notebook. Same account, nothing to type.
              </p>
              <Button variant="primary" size="md" onClick={() => navigate('/voice')}>
                Meet DFM Voice <ArrowRight size={15} className="inline ml-1.5 -mt-0.5" />
              </Button>
            </div>

            {/* Mini orb motif */}
            <div className="relative flex-shrink-0 flex flex-col items-center gap-3">
              <VoiceOrb size={132} state="listening" />
              <span className="font-handwriting text-[#5D8E67]/55 text-xl select-none">it opens listening</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COMMUNITY NOTES WALL — NOT a card grid
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-10 py-20 relative overflow-hidden">
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >

          {/* Header — off-center */}
          <div className="mb-12 flex items-end gap-4">
            <div className="max-w-lg">
              <HandwrittenLabel className="mb-2">from the community</HandwrittenLabel>
              <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-3">
                You're not the only one.
              </h2>
              <p className="font-comfortaa text-[#5D8E67]/60 text-base">
                Real reflections. Anonymous students. Genuine moments.
              </p>
            </div>
            <DfmIconSlot variant="glue" size="md" className="mb-1 hidden sm:flex" />
          </div>

          {/* Note wall — shown only after live stories load */}
          {communityLoaded && communityNotes.length > 0 && (
          <div className="relative">
            {/* Row 1 */}
            <div className="flex flex-wrap gap-4 mb-4 items-end">
              <StickyNote
                text={communityNotes[0] ?? ''}
                rotate="-1.5deg"
                color="bg-[#FEE188]/70"
                className="flex-shrink-0"
              />
              {/* Folded letter style */}
              <div className="bg-[#B7E3FF]/40 border border-[#B7E3FF]/70 rounded-lg p-4 max-w-[240px] card-hover" style={{ transform: 'rotate(0.8deg)' }}>
                <div className="w-full h-px bg-[#5D8E67]/10 mb-1" />
                <div className="w-full h-px bg-[#5D8E67]/10 mb-3" />
                <p className="font-handwriting text-[#3a5c42] text-base leading-snug">"{communityNotes[1] ?? ''}"</p>
                <div className="w-full h-px bg-[#5D8E67]/10 mt-3" />
              </div>
              <StickyNote
                text={communityNotes[4] ?? ''}
                rotate="2deg"
                color="bg-[#FFD1BD]/65"
                className="flex-shrink-0 hidden sm:block"
              />
            </div>

            {/* Row 2 — shifted */}
            <div className="flex flex-wrap gap-4 ml-8 sm:ml-20 items-start">
              <div className="bg-[#9FD89C]/35 border border-[#9FD89C]/60 rounded-lg p-4 max-w-[220px] card-hover" style={{ transform: 'rotate(-0.5deg)' }}>
                <p className="font-handwriting text-[#3a5c42] text-base leading-snug">"{communityNotes[2] ?? ''}"</p>
              </div>
              <StickyNote
                text={communityNotes[3] ?? ''}
                rotate="1.5deg"
                color="bg-[#FEE188]/60"
                className="flex-shrink-0"
              />
              <StickyNote
                text={communityNotes[5] ?? ''}
                rotate="-2.5deg"
                color="bg-[#B7E3FF]/50"
                className="flex-shrink-0 hidden md:block"
              />
            </div>

            {/* Annotation */}
            <div className="absolute -right-2 top-4 hidden lg:flex flex-col items-end gap-1">
              <HandwrittenLabel>pinned by students like you</HandwrittenLabel>
              <svg width="44" height="36" viewBox="0 0 44 36" className="text-[#5D8E67]/30">
                <path d="M42 4 Q20 8 6 28" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M3 25 L6 28 L9 25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          )}

          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={() => navigate('/stories')}
              className="font-comfortaa font-semibold text-[#5D8E67] text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all group"
            >
              Read all stories
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <div className="h-px flex-1 bg-[#9FD89C]/30 max-w-xs" />
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA — asymmetric, letter-like
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-10 py-16 bg-[#FEE188]/15 border-t border-[#FEE188]/40 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8">

          {/* Letter-style block — left */}
          <div className="flex-1 min-w-0">
            <p className="font-handwriting text-[#5D8E67]/55 text-base sm:text-lg mb-3">a note from us</p>
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl leading-tight mb-4">
              Write to the version<br />of yourself who<br />made it through.
            </h2>
            <p className="font-handwriting text-[#5D8E67]/55 text-lg leading-relaxed max-w-sm">
              You don't need to have it figured out. You just need five minutes and a little honesty.
            </p>
          </div>

          {/* CTA block — right, slightly elevated feel */}
          <div className="flex-shrink-0 flex flex-col gap-3 w-full sm:w-auto">
            <Button variant="primary" size="lg" onClick={() => navigate('/check-in')}>
              Start Your Reflection
            </Button>
            <button
              onClick={() => navigate('/sign-up')}
              className="font-comfortaa text-sm text-[#5D8E67]/60 hover:text-[#5D8E67] text-center transition-colors"
            >
              Create a free account to save your work
            </button>
          </div>

          {/* Floating star cluster */}
          <div className="absolute right-12 top-8 pointer-events-none hidden lg:flex flex-col gap-2 opacity-60">
            <Star size={24} className="text-[#FEE188] animate-float" fill="#FEE188" />
            <Star size={16} className="text-[#FEE188] animate-float-slow ml-6" fill="#FEE188" />
            <Star size={20} className="text-[#FEE188] animate-float-delayed ml-2" fill="#FEE188" />
          </div>
        </div>
      </section>

    </PageWrapper>
  );
}
