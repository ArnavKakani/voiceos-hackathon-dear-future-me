import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Award, Check, CheckCircle, ChevronDown, Laptop, Lock, MessageSquare,
  Mic, Pencil, Smartphone, Sparkles, Star,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { VoiceOrb } from '../components/ui/VoiceOrb';
import { PageWrapper } from '../components/layout/PageWrapper';
import supabase from '../supabase/client';

/* ════════════════════════════════════════════════════════════════════════════
   DEMO DESTINATION — the one place to change when the build ships

   Today DFM Voice lives on the demo iPhones only, so "Open the demo" fires the
   app's custom URL scheme. Phones with the app installed jump straight into a
   listening session; every other device simply does nothing visible, which is
   why the Caveat note below the button explains where to find it instead.

   When TestFlight is live: set DEMO_URL to the invite link
   (e.g. 'https://testflight.apple.com/join/XXXXXXXX') and flip
   DEMO_IS_DEEP_LINK to false. The button then opens it in a new tab and the
   note softens automatically. Nothing else on this page needs to change.
   ═══════════════════════════════════════════════════════════════════════════ */
const DEMO_URL = 'dearfutureme://talk';
const DEMO_IS_DEEP_LINK = true;
const DEMO_NOTE = DEMO_IS_DEEP_LINK
  ? 'have the app? it opens listening — on the demo iPhone at our table otherwise'
  : 'the TestFlight invite just opened in a new tab — say yes to notifications and it lands in minutes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ════════════════════════════════════════════════════════════════════════════
   MOTION VOCABULARY

   DESIGN_SYSTEM.md §17 #10: motion is slow and small. Everything here shares
   one ease and one duration band — long enough to read as deliberate, never
   springy. Reduced motion is handled in two halves: <MotionConfig
   reducedMotion="user"> in App.tsx flattens the declarative animations, and
   useReducedMotion() below zeroes the scroll-linked parallax, which
   MotionConfig cannot see.
   ═══════════════════════════════════════════════════════════════════════════ */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const copyGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};

const copyItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/** Overlaps the visual with the copy by a beat so the two read as one move. */
const visualIn = {
  initial: { opacity: 0, y: 26, scale: 0.985 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.8, ease: EASE, delay: 0.12 },
} as const;

/**
 * Small vertical drift tied to the step's own passage through the viewport.
 * `distance` is the half-range in px — 0 when the reader asked for less motion.
 */
function useStepParallax(ref: RefObject<HTMLElement>, distance: number) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const travel = reduced ? 0 : distance;
  return useTransform(scrollYProgress, [0, 1], [travel, -travel]);
}

/* ── The spoken sample ────────────────────────────────────────────────────────
   One invented sentence, carried through steps 2 → 4 so the walkthrough is a
   single continuous thought rather than four unrelated screenshots. It is
   labelled as a mock in the section intro; nothing on this page is anyone's
   real notebook. */
const SPOKEN_LINE = "I finally sent the email I'd been putting off for three weeks.";
const SPOKEN_WORDS = SPOKEN_LINE.split(' ');

const surfaces = [
  {
    icon: Lock,
    label: 'Lock Screen widget',
    body: 'A small pencil glyph beside the clock — the shortest path from a thought to a kept one.',
    accent: 'bg-[#FFD1BD]/20 border-[#FFD1BD]',
  },
  {
    icon: Smartphone,
    label: 'Home Screen orb',
    body: 'The orb itself, breathing quietly on your home screen until you tap it.',
    accent: 'bg-[#9FD89C]/20 border-[#9FD89C]',
  },
  {
    icon: Mic,
    label: 'Siri',
    body: '"Hey Siri, save to Dear Future Me" — a quick save that never opens a screen.',
    accent: 'bg-[#FEE188]/25 border-[#FEE188]',
  },
  {
    icon: Laptop,
    label: 'VoiceOS on Mac',
    body: 'Talk to your Mac mid-work and it writes to the same notebook you read on the web.',
    accent: 'bg-[#B7E3FF]/25 border-[#B7E3FF]',
  },
];

const wantOptions = [
  { value: 'iphone', label: 'the iPhone app' },
  { value: 'android', label: 'an Android version' },
  { value: 'mac', label: 'the Mac notch' },
  { value: 'updates', label: 'just updates' },
];

type SubmitStatus = 'idle' | 'sending' | 'done' | 'error';

/* ════════════════════════════════════════════════════════════════════════════
   WALKTHROUGH — one step
   ═══════════════════════════════════════════════════════════════════════════ */

interface WalkStepProps {
  n: string;
  eyebrow: string;
  title: string;
  body: string;
  aside: string;
  dot: string;
  /** Visual on the left instead of the right — alternates down the page. */
  flip?: boolean;
  children: ReactNode;
}

function WalkStep({ n, eyebrow, title, body, aside, dot, flip = false, children }: WalkStepProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visualY = useStepParallax(ref, 26);
  const copyY = useStepParallax(ref, 10);

  return (
    <div
      ref={ref}
      className="relative px-4 sm:px-6 lg:px-10 py-14 lg:py-20 min-h-[78vh] flex items-center"
    >
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Copy */}
        <motion.div
          style={{ y: copyY }}
          className={flip ? 'lg:order-2' : ''}
        >
          <motion.div
            variants={copyGroup}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.div variants={copyItem} className="flex items-center gap-2.5 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="font-comfortaa font-bold text-[#5D8E67]/50 text-[11px] tracking-widest">{n}</span>
              <span className="font-handwriting text-[#5D8E67]/55 text-xl leading-none">{eyebrow}</span>
            </motion.div>

            <motion.h3
              variants={copyItem}
              className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl leading-tight mb-4"
            >
              {title}
            </motion.h3>

            <motion.p
              variants={copyItem}
              className="font-comfortaa text-[#5D8E67]/70 text-base sm:text-lg leading-relaxed max-w-md"
            >
              {body}
            </motion.p>

            <motion.p
              variants={copyItem}
              className="font-handwriting text-[#5D8E67]/55 text-xl leading-snug mt-5 max-w-xs"
            >
              {aside}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Visual */}
        <motion.div style={{ y: visualY }} className={flip ? 'lg:order-1' : ''}>
          <motion.div {...visualIn}>{children}</motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   WALKTHROUGH — the four mocks

   Everything below is drawn in JSX/CSS. No screenshots, no invented user data:
   the widget copy is lifted verbatim from ios/DFMWidget/DFMWidget.swift, and
   the single sample sentence is the reader's own imagined one.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Step 1 — the Lock Screen, with the real accessory widgets on it. */
function LockScreenMock() {
  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="relative rounded-[2.25rem] border-2 border-[#5D8E67]/25 bg-[#F9F5ED] bg-grid px-5 pt-7 pb-8 shadow-card overflow-hidden">

        {/* Notch */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2 h-1.5 w-16 rounded-full bg-[#5D8E67]/15" />

        {/* Clock stack — the circular accessory widget sits beside it */}
        <div className="flex items-center justify-center gap-3 mt-3 mb-1">
          <div className="w-9 h-9 rounded-full border-2 border-[#5D8E67]/35 flex items-center justify-center">
            <Pencil size={14} className="text-[#5D8E67]/70" />
          </div>
          <p className="font-comfortaa text-[#5D8E67]/55 text-xs">{today}</p>
        </div>

        <p className="font-comfortaa font-bold text-[#5D8E67] text-5xl text-center leading-none mb-6">
          9:41
        </p>

        {/* The accessoryRectangular widget, word for word */}
        <div className="relative">
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-2xl border-2 border-[#9FD89C]"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.65, 0], scale: [1, 1.05, 1.09] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' }}
          />
          <div className="relative rounded-2xl border-2 border-[#5D8E67]/25 bg-[#9FD89C]/20 px-3 py-2.5 flex items-start gap-2.5">
            <Pencil size={13} className="text-[#5D8E67] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-comfortaa font-bold text-[#5D8E67] text-[11px] leading-tight">
                Dear Future Me
              </p>
              <p className="font-comfortaa text-[#5D8E67]/70 text-[11px] leading-snug">
                Tap: what's worth remembering today?
              </p>
            </div>
          </div>

          {/* Fingertip */}
          <motion.span
            aria-hidden="true"
            className="absolute -bottom-3 right-7 w-7 h-7 rounded-full bg-[#5D8E67]/20 border-2 border-[#5D8E67]/30"
            animate={{ scale: [1, 0.85, 1], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
          />
        </div>

        <p className="font-handwriting text-[#5D8E67]/50 text-lg text-center mt-8">
          no unlock, no app to find
        </p>
      </div>
    </div>
  );
}

/** Step 2 — the orb, already listening, and the line coming in as you say it. */
function ListeningMock() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <VoiceOrb size={200} state="listening" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border-2 border-[#9FD89C] bg-[#F9F5ED] px-3.5 py-1">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#5D8E67]"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-comfortaa font-bold text-[#5D8E67]/70 text-[11px] tracking-widest">
            LISTENING
          </span>
        </span>
      </div>

      {/* relative z-10: the orb's iframe is scaled 1.9× and spills well past its
          own box, so without a stacking context of its own this card's text
          would be painted over by an absolutely positioned sibling. */}
      <motion.div
        className="relative z-10 mt-14 w-full max-w-sm rounded-2xl border-2 border-[#9FD89C] bg-[#9FD89C]/15 px-5 py-4"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
      >
        <span className="font-comfortaa font-bold text-[#5D8E67]/50 text-[10px] tracking-widest block mb-2">
          YOU SAY
        </span>
        <motion.p
          className="font-handwriting text-[#3a5c42]/80 text-2xl leading-snug"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
        >
          {SPOKEN_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              className="inline-block mr-[0.28em]"
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>
      </motion.div>
    </div>
  );
}

/** Step 3 — what lands in the notebook, chip and all. */
function NotebookCardMock() {
  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* The stack it joins */}
      <div className="absolute -top-3 left-3 right-3 h-full rounded-2xl border-2 border-[#9FD89C]/40 bg-[#9FD89C]/10" />
      <div className="absolute -top-1.5 left-1.5 right-1.5 h-full rounded-2xl border-2 border-[#FEE188]/50 bg-[#FEE188]/15" />

      <motion.div
        className="relative rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/20 p-5 shadow-card"
        initial={{ opacity: 0, y: 18, rotate: -1.2 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#FFD1BD] bg-[#F9F5ED] px-3 py-1">
            <Award size={12} className="text-[#5D8E67]" />
            <span className="font-comfortaa font-bold text-[#5D8E67] text-[11px]">Accomplishment</span>
          </span>
          <span className="font-comfortaa text-[#5D8E67]/55 text-[11px]">{today}</span>
        </div>

        <h4 className="font-comfortaa font-bold text-[#5D8E67] text-lg leading-snug mb-2">
          The email I'd been avoiding
        </h4>

        <div className="bg-lined rounded-xl px-1 py-1">
          <p className="font-handwriting text-[#3a5c42]/75 text-xl leading-[28px]">
            {SPOKEN_LINE}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#5D8E67]/15">
          <Check size={13} className="text-[#5D8E67]" />
          <span className="font-comfortaa text-[#5D8E67]/70 text-xs">
            Saved to your notebook — the same one on the web
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/** Step 4 — the letter waiting, and the text that arrives when it opens. */
function FutureYouMock() {
  return (
    <div className="mx-auto w-full max-w-sm">

      {/* Sealed letter */}
      <motion.div
        className="rounded-2xl border-2 border-[#FEE188] bg-[#FEE188]/25 p-5"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.15 }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#FEE188] bg-[#F9F5ED] px-3 py-1">
            <Pencil size={11} className="text-[#5D8E67]" />
            <span className="font-comfortaa font-bold text-[#5D8E67] text-[11px]">Letter</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock size={11} className="text-[#5D8E67]/55" />
            <span className="font-comfortaa text-[#5D8E67]/55 text-[11px]">opens in one year</span>
          </span>
        </div>

        <div className="bg-lined rounded-xl px-1 py-1">
          <p className="font-handwriting text-[#3a5c42]/70 text-xl leading-[28px]">
            Dear future me — by the time you read this,
          </p>
          <p className="font-handwriting text-[#3a5c42]/30 text-xl leading-[28px] select-none">
            sealed until then
          </p>
        </div>
      </motion.div>

      {/* Arrow of time */}
      <motion.div
        className="flex items-center gap-3 my-4 pl-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
      >
        <span className="w-px h-8 bg-[#5D8E67]/25" />
        <span className="font-handwriting text-[#5D8E67]/55 text-lg">one year later</span>
      </motion.div>

      {/* The text message from future you */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2 pl-1">
          <MessageSquare size={12} className="text-[#5D8E67]/55" />
          <span className="font-comfortaa font-bold text-[#5D8E67]/55 text-[11px] tracking-widest">
            FROM FUTURE YOU
          </span>
        </div>
        <div className="rounded-2xl rounded-bl-md border-2 border-[#B7E3FF] bg-[#B7E3FF]/25 px-4 py-3 max-w-[17rem]">
          <p className="font-handwriting text-[#3a5c42]/80 text-xl leading-snug">
            A year ago you sent the email you'd been putting off. You asked me to remind you that you did.
          </p>
        </div>
        <p className="font-handwriting text-[#5D8E67]/50 text-base mt-2 pl-1">
          same notebook, arriving as a text
        </p>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export function DfmVoicePage() {
  const [demoTried, setDemoTried] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [want, setWant] = useState('');
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');

  // The rail beside the walkthrough. Spring-smoothed so the fill glides rather
  // than tracking the wheel one-to-one; scroll-linked, so it stays honest under
  // reduced motion without needing to be switched off.
  const walkRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: walkProgress } = useScroll({
    target: walkRef,
    offset: ['start 0.85', 'end 0.55'],
  });
  const railFill = useSpring(walkProgress, { stiffness: 45, damping: 22, restDelta: 0.001 });

  const openDemo = () => {
    setDemoTried(true);
    try {
      if (DEMO_IS_DEEP_LINK) {
        // Phones with the app registered for `dearfutureme://` hand off here.
        // Everywhere else this is a no-op, and the note below explains why.
        window.location.href = DEMO_URL;
      } else {
        window.open(DEMO_URL, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Could not open the DFM Voice demo:', err);
    }
  };

  const scrollToWaitlist = () => {
    document.getElementById('dfm-voice-waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!EMAIL_RE.test(cleanEmail)) {
      setEmailError('That address looks incomplete — mind checking it?');
      return;
    }
    setEmailError('');
    setStatus('sending');

    // Written into the existing write-only `feedback` table. One compact,
    // human-readable line so whoever reads the table gets the whole signup
    // without needing new columns.
    const wantLabel = wantOptions.find((o) => o.value === want)?.label ?? 'not specified';
    const summary = [
      'DFM Voice waitlist',
      `email: ${cleanEmail}`,
      `phone: ${phone.trim() || 'not given'}`,
      `wants first: ${wantLabel}`,
    ].join(' · ');

    try {
      const { error } = await supabase.from('feedback').insert({
        feedback_content: summary,
        category: 'dfm_voice_waitlist',
        email: cleanEmail,
      });
      if (error) throw error;
      setStatus('done');
    } catch (err) {
      console.error('DFM Voice waitlist signup failed:', err);
      // Always leaves 'sending' — the button never sits spinning forever.
      setStatus('error');
    }
  };

  return (
    <PageWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-10 py-16 lg:py-20">
        <Star className="absolute top-10 right-16 text-[#FEE188] animate-float opacity-50 pointer-events-none" size={26} fill="#FEE188" />
        <Star className="absolute bottom-16 left-10 text-[#FEE188] animate-float-slow opacity-30 pointer-events-none" size={18} fill="#FEE188" />
        <Sparkles className="absolute top-24 left-1/3 text-[#9FD89C] animate-sparkle opacity-30 pointer-events-none" size={14} />
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-[#9FD89C]/10 blur-3xl pointer-events-none" />

        <motion.div
          className="max-w-5xl mx-auto relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left: the promise */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 font-handwriting text-[#5D8E67]/70 text-lg mb-5 bg-[#9FD89C]/20 px-4 py-1 rounded-full border border-[#9FD89C]/40">
                <Sparkles size={12} /> new — built at the VoiceOS hackathon
              </span>

              <h1 className="font-comfortaa font-bold text-[#5D8E67] text-5xl sm:text-6xl mb-4 leading-tight">
                DFM Voice
              </h1>

              <p className="font-comfortaa text-[#5D8E67]/75 text-lg sm:text-xl leading-relaxed mb-5 max-w-md mx-auto lg:mx-0">
                Talk to future you. One tap from your Lock Screen and it's already
                listening — no app to open, nothing to type.
              </p>

              <p className="font-handwriting text-[#5D8E67]/55 text-xl mb-8 max-w-sm mx-auto lg:mx-0 leading-relaxed">
                "The thought you almost didn't write down is usually the one worth keeping."
              </p>

              {/* Exactly two CTAs — primary / secondary pair */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button variant="primary" size="lg" onClick={openDemo}>
                  <Mic size={17} className="inline mr-2 -mt-0.5" />
                  Open the demo
                </Button>
                <Button variant="secondary" size="lg" onClick={scrollToWaitlist}>
                  Join the waitlist
                </Button>
              </div>

              {demoTried && (
                <motion.p
                  className="font-handwriting text-[#5D8E67]/55 text-lg mt-4 max-w-xs mx-auto lg:mx-0 leading-snug"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {DEMO_NOTE}
                </motion.p>
              )}
            </div>

            {/* Right: the orb */}
            <div className="relative flex-shrink-0 flex justify-center lg:pr-8">
              <VoiceOrb size={236} state="listening" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          WALKTHROUGH — five scroll-driven steps, one continuous sentence

          Steps 1–4 alternate side to side; each animates itself as it enters
          the viewport and drifts at its own rate on the way past. The rail on
          the left fills with the reader's progress through the whole run.
      ══════════════════════════════════════════════════════════════════ */}
      {/* No `overflow-hidden` on the wrapper below, on purpose: an overflow
          ancestor becomes the scroll container for `position: sticky`, and the
          progress rail would silently stop sticking. */}
      <div
        ref={walkRef}
        id="how-it-works"
        className="relative bg-[#F9F5ED] border-t border-[#9FD89C]/25 scroll-mt-16"
      >
        {/* Progress rail */}
        <div className="pointer-events-none absolute left-5 top-0 bottom-0 hidden lg:block" aria-hidden="true">
          <div className="sticky top-0 h-screen flex items-center">
            <div className="relative w-[2px] h-[55vh] rounded-full bg-[#5D8E67]/15">
              <motion.div
                className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-[#5D8E67]/40"
                style={{ scaleY: railFill }}
              />
            </div>
          </div>
        </div>

        {/* Intro */}
        <section className="px-4 sm:px-6 lg:px-10 pt-16 pb-4">
          <motion.div
            className="max-w-5xl mx-auto sm:ml-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="font-handwriting text-[#5D8E67]/55 text-2xl block mb-1">
              four seconds, start to finish
            </span>
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-3">
              How it works
            </h2>
            <p className="font-comfortaa text-[#5D8E67]/55 text-sm max-w-md leading-relaxed">
              Everything below is drawn, not screenshotted — one made-up sentence followed all
              the way from a tap to a text a year later. No one's real notebook is on this page.
            </p>
          </motion.div>
        </section>

        <WalkStep
          n="01"
          eyebrow="the shortest way in"
          title="One tap from your Lock Screen"
          body="A pencil beside your clock, with today's prompt already on it. Tap it and Dear Future Me opens — no unlocking, no hunting for an app, no record button waiting to be found."
          aside="the same widget lives on your Home Screen and your watch"
          dot="bg-[#FFD1BD]"
        >
          <LockScreenMock />
        </WalkStep>

        <WalkStep
          n="02"
          eyebrow="no button to press"
          title="It's already listening"
          body="The orb is live the moment the app appears. Say the thing the way you'd say it out loud — half-formed, out of order, mid-walk. It keeps up, and it waits when you pause."
          aside="you talk, it writes. that's the whole interface."
          dot="bg-[#FEE188]"
          flip
        >
          <ListeningMock />
        </WalkStep>

        <WalkStep
          n="03"
          eyebrow="filed, not logged"
          title="Kept, in your own words"
          body="An agent decides what it was — a reflection, a proud moment, a letter — and files it into your notebook under that kind. Your phrasing, untouched. Not a transcript buried in a chat history."
          aside="open the web notebook and it's already there"
          dot="bg-[#9FD89C]"
        >
          <NotebookCardMock />
        </WalkStep>

        <WalkStep
          n="04"
          eyebrow="the part that's worth it"
          title="Future you gets it"
          body="Name a date out loud and the letter seals until then. When it opens, it finds you where you already are — as a text, in your notebook, or read back the next time you ask what you were working on."
          aside="a year is a long time to keep a promise. it keeps it."
          dot="bg-[#B7E3FF]"
          flip
        >
          <FutureYouMock />
        </WalkStep>

        {/* ── Finale: every way in, then the two CTAs again ────────────── */}
        <section className="px-4 sm:px-6 lg:px-10 pt-8 pb-20">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="mb-8 sm:ml-6">
              <span className="font-handwriting text-[#5D8E67]/55 text-2xl block mb-1">
                wherever you already are
              </span>
              <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl">
                Four ways in.
              </h2>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {surfaces.map(({ icon: Icon, label, body, accent }, i) => (
                <motion.div
                  key={label}
                  className={`rounded-2xl border-2 p-5 card-hover ${accent} ${i % 2 === 1 ? 'lg:mt-6' : ''}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-[#F9F5ED] border border-[#5D8E67]/20 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-[#5D8E67]" />
                  </div>
                  <h3 className="font-comfortaa font-bold text-[#5D8E67] text-[15px] mb-1.5">{label}</h3>
                  <p className="font-comfortaa text-[#5D8E67]/70 text-sm leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="mt-12 rounded-2xl border-2 border-[#9FD89C] bg-[#9FD89C]/15 px-6 py-8 sm:px-10 text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            >
              <h3 className="font-comfortaa font-bold text-[#5D8E67] text-2xl sm:text-3xl mb-3 leading-tight">
                That's the whole thing.
              </h3>
              <p className="font-handwriting text-[#5D8E67]/70 text-xl mb-7 max-w-sm mx-auto leading-relaxed">
                four seconds you'd have spent forgetting it instead
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="primary" size="lg" onClick={openDemo}>
                  <Mic size={17} className="inline mr-2 -mt-0.5" />
                  Open the demo
                </Button>
                <Button variant="secondary" size="lg" onClick={scrollToWaitlist}>
                  Join the waitlist
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          WAITLIST
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="dfm-voice-waitlist"
        className="px-4 sm:px-6 lg:px-10 py-16 bg-[#9FD89C]/15 border-t border-[#9FD89C]/30 relative overflow-hidden scroll-mt-16"
      >
        <Sparkles className="absolute top-10 right-1/4 text-[#9FD89C] animate-sparkle opacity-40 pointer-events-none" size={16} />

        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {status === 'done' ? (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="w-20 h-20 rounded-full bg-[#9FD89C]/40 border-2 border-[#9FD89C] flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={36} className="text-[#5D8E67]" />
              </div>
              <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl mb-4 leading-tight">
                You're on the list.
              </h2>
              <p className="font-handwriting text-[#5D8E67]/70 text-xl leading-relaxed max-w-sm mx-auto">
                We'll write to you the day it's ready — no drip campaign, no launch countdown.
                Just one message from us, to you.
              </p>
              <p className="font-handwriting text-[#5D8E67]/55 text-lg mt-4">
                thanks for wanting this to exist.
              </p>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <span className="inline-block font-handwriting text-[#5D8E67]/70 text-lg mb-4 bg-[#FEE188]/35 px-4 py-1 rounded-full border border-[#FEE188]/70">
                  not on the App Store yet
                </span>
                <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-3 leading-tight">
                  Join the waitlist
                </h2>
                <p className="font-comfortaa text-[#5D8E67]/70 leading-relaxed max-w-md mx-auto">
                  DFM Voice runs on our demo devices today. Leave an address and we'll tell you
                  the moment there's a build you can install.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-[#F9F5ED] border-2 border-[#9FD89C] rounded-3xl p-6 sm:p-8 shadow-card">

                {/* Email — required */}
                <label htmlFor="dfm-voice-email" className="block font-comfortaa font-bold text-[#5D8E67] text-sm mb-2">
                  Email
                </label>
                <input
                  id="dfm-voice-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                  placeholder="you@example.com"
                  className="w-full bg-[#F9F5ED] border-2 border-[#9FD89C]/60 rounded-2xl px-4 py-3 font-comfortaa text-[#5D8E67] text-base placeholder:text-[#5D8E67]/30 focus:outline-none focus:border-[#5D8E67] transition-colors"
                />
                {emailError && (
                  <p className="font-handwriting text-[#5D8E67]/70 text-lg mt-2">{emailError}</p>
                )}

                {/* Phone — optional */}
                <label htmlFor="dfm-voice-phone" className="block font-comfortaa font-bold text-[#5D8E67] text-sm mt-5 mb-2">
                  Phone <span className="font-normal text-[#5D8E67]/55">— optional, for text updates</span>
                </label>
                <input
                  id="dfm-voice-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 012-3456"
                  className="w-full bg-[#F9F5ED] border-2 border-[#9FD89C]/60 rounded-2xl px-4 py-3 font-comfortaa text-[#5D8E67] text-base placeholder:text-[#5D8E67]/30 focus:outline-none focus:border-[#5D8E67] transition-colors"
                />

                {/* Preference — optional */}
                <label htmlFor="dfm-voice-want" className="block font-comfortaa font-bold text-[#5D8E67] text-sm mt-5 mb-2">
                  What do you want first? <span className="font-normal text-[#5D8E67]/55">— optional</span>
                </label>
                <div className="relative">
                  <select
                    id="dfm-voice-want"
                    value={want}
                    onChange={(e) => setWant(e.target.value)}
                    className="w-full appearance-none bg-[#F9F5ED] border-2 border-[#9FD89C]/60 rounded-2xl pl-4 pr-10 py-3 font-comfortaa text-[#5D8E67] text-base focus:outline-none focus:border-[#5D8E67] transition-colors cursor-pointer"
                  >
                    <option value="">No preference</option>
                    {wantOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5D8E67]/55 pointer-events-none" />
                </div>

                {status === 'error' && (
                  <div className="mt-5 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-3">
                    <p className="font-handwriting text-[#5D8E67]/75 text-lg leading-snug">
                      That didn't go through — our end, not yours. Give it one more try?
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    fullWidth
                    disabled={status === 'sending'}
                  >
                    {status === 'sending' ? 'Adding you…' : status === 'error' ? 'Try again' : 'Keep me posted'}
                  </Button>
                </div>

                <p className="font-handwriting text-[#5D8E67]/55 text-base mt-4 text-center leading-snug">
                  one email when it ships. that's the whole plan.
                </p>
              </form>
            </>
          )}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTNOTE — the honest small print
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-10 py-12 border-t border-[#9FD89C]/25">
        <div className="max-w-2xl mx-auto flex items-start gap-3">
          <Pencil size={14} className="text-[#5D8E67]/30 mt-1 flex-shrink-0" />
          <p className="font-comfortaa text-[#5D8E67]/55 text-sm leading-relaxed">
            DFM Voice was built at the VoiceOS hackathon and is still hackathon-fresh — demo
            devices only, no App Store listing yet. It signs into the same Dear Future Me
            account you use here, and everything you say lands in the same notebook. Nothing
            separate, nothing to migrate later.
          </p>
        </div>
      </section>

    </PageWrapper>
  );
}
