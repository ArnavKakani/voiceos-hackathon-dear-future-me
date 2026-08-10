import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ExternalLink, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import { CrumpleDraftBin } from '../components/notebook/CrumpleDraftBin';
import { MemoryFileCabinet, type CabinetFile } from '../components/notebook/MemoryFileCabinet';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase/client';

// ── Non-Resume Accomplishments ────────────────────────────────────────────────
function NonResumeSection() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const days = ['s', 'm', 't', 'w', 't', 'f', 's'];
  const todayIdx = today.getDay();

  if (saved) {
    return (
      <div className="space-y-3">
        <div className="bg-[#FFD1BD]/20 border-2 border-[#FFD1BD]/60 rounded-2xl p-5">
          <p className="font-comfortaa text-xs text-[#5D8E67]/50 uppercase tracking-widest mb-1">Saved</p>
          <p className="font-handwriting text-[#2d4a35] text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
        <button onClick={() => setSaved(false)} className="font-comfortaa text-xs text-[#5D8E67]/50 underline hover:text-[#5D8E67] transition-colors">Edit</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-comfortaa text-[#5D8E67]/70 text-sm leading-relaxed">
        Share something you're proud of that would never go on your resume. It could be a small act of kindness, a personal growth moment, or anything meaningful to you that wouldn't impress a hiring manager.
      </p>
      <div className="relative rounded-2xl overflow-hidden border border-[#c8b89a]/60 shadow-sm" style={{ background: '#faf8f2' }}>
        {/* Spiral rings */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-[#c8b89a]/30">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full border-[1.5px] border-[#9b8c72]/45 bg-[#e4ddd0]" />
          ))}
        </div>
        {/* Date + day row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <span className="font-mono text-[#5D8E67]/40 text-[11px] tracking-wider">{dateStr}</span>
          <div className="flex gap-2">
            {days.map((d, i) => (
              <span key={i} className={`font-mono text-[10px] ${i === todayIdx ? 'text-[#5D8E67] font-bold' : 'text-[#5D8E67]/25'}`}>{d}</span>
            ))}
          </div>
        </div>
        {/* Grid */}
        <div className="absolute inset-0 top-16 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(93,142,103,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(93,142,103,0.07) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }} />
        {/* Body */}
        <div className="relative z-10 mx-4 mt-2 mb-4 border border-[#5D8E67]/20 rounded">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Write about something you're proud of that you'd never put on an application..."
            className="w-full bg-transparent px-3 py-3 font-handwriting text-[#2d4a35] text-lg leading-relaxed placeholder:text-[#5D8E67]/25 focus:outline-none resize-none"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', lineHeight: '1.9' }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <motion.button
          onClick={() => { if (text.trim()) setSaved(true); }}
          disabled={!text.trim()}
          className="font-comfortaa font-semibold text-sm bg-[#5D8E67] text-[#F9F5ED] px-5 py-2 rounded-xl hover:bg-[#4a7255] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
        >
          Save
        </motion.button>
      </div>
    </div>
  );
}

// ── Vision Board ─────────────────────────────────────────────────────────────
function VisionBoardSection() {
  const [option, setOption] = useState<'slides' | 'canva'>('slides');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const days = ['s', 'm', 't', 'w', 't', 'f', 's'];
  const todayIdx = today.getDay();

  const slidesSteps: React.ReactNode[] = [
    <>Go to <a href="https://slides.new" target="_blank" rel="noreferrer" className="text-[#5D8E67] underline underline-offset-2">slides.new</a></>,
    'Click File → Page setup → Custom and choose 8.5 x 11 or 11 x 8.5 inches',
    'Add images (Insert → Image → Search the web)',
    'Add text boxes with quotes, goals, or words that matter to you',
    'Click File → Download → JPEG or PDF, and save your file',
  ];
  const canvaSteps: React.ReactNode[] = [
    <>Go to <a href="https://canva.com" target="_blank" rel="noreferrer" className="text-[#5D8E67] underline underline-offset-2">canva.com</a> and log in or create a free account</>,
    'Search for "vision board" or "poster" to start',
    'Add images, words, and designs that reflect your goals',
    'Click Share → Download, select PNG or PDF, and save your file',
  ];
  const steps = option === 'slides' ? slidesSteps : canvaSteps;
  const dotColor = option === 'slides' ? 'bg-[#FFD1BD]/60 border-[#FFD1BD]' : 'bg-[#B7E3FF]/60 border-[#B7E3FF]';

  return (
    <div className="space-y-4">
      <p className="font-comfortaa text-[#5D8E67]/70 text-sm leading-relaxed">
        A vision board is a visual representation of your goals, values, and the future you want to build. It's personal, creative, and doesn't have to be about academics or career.
      </p>

      {/* Notebook shell */}
      <div className="relative rounded-2xl overflow-hidden border border-[#c8b89a]/60 shadow-sm" style={{ background: '#faf8f2' }}>
        {/* Spiral rings */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-[#c8b89a]/30">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full border-[1.5px] border-[#9b8c72]/45 bg-[#e4ddd0]" />
          ))}
        </div>
        {/* Date + day row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <span className="font-mono text-[#5D8E67]/40 text-[11px] tracking-wider">{dateStr}</span>
          <div className="flex gap-2">
            {days.map((d, i) => (
              <span key={i} className={`font-mono text-[10px] ${i === todayIdx ? 'text-[#5D8E67] font-bold' : 'text-[#5D8E67]/25'}`}>{d}</span>
            ))}
          </div>
        </div>
        {/* Grid */}
        <div className="absolute inset-0 top-16 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(93,142,103,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(93,142,103,0.07) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }} />

        <div className="relative z-10 px-5 pt-3 pb-5 space-y-4">
          {/* Option tabs inside notebook */}
          <div className="flex gap-2">
            {(['slides', 'canva'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOption(o)}
                className={`font-comfortaa font-semibold text-xs px-3 py-1 rounded-full border-2 transition-all ${
                  option === o
                    ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]'
                    : 'border-[#9FD89C]/50 text-[#5D8E67]/60 hover:border-[#5D8E67]'
                }`}
              >
                {o === 'slides' ? 'Google Slides' : 'Canva'}
              </button>
            ))}
          </div>

          {/* Steps in handwriting style */}
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold text-[#5D8E67] flex-shrink-0 mt-0.5 ${dotColor}`}>{i + 1}</span>
                <span className="font-handwriting text-[#2d4a35] text-base leading-snug" style={{ fontFamily: "'Caveat', cursive" }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Padlet embed */}
      <div>
        <p className="font-handwriting text-[#5D8E67]/70 text-base mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
          Ready to share? Upload to our community wall — anonymous and reviewed before posting.
        </p>
        <div className="rounded-2xl overflow-hidden border border-[#c8b89a]/50 shadow-sm" style={{ height: 480 }}>
          <iframe
            src="https://padlet.com/embed/az8l0z5n3ovuib6a"
            allow="camera;microphone;geolocation"
            className="w-full h-full border-0"
            title="Dear Future Me Vision Board Community Padlet"
          />
        </div>
        <a
          href="https://padlet.com/suhani3/dear-future-me-az8l0z5n3ovuib6a"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 font-comfortaa text-xs text-[#5D8E67]/50 hover:text-[#5D8E67] transition-colors"
        >
          Open Padlet in new tab <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

// ── Letter to Future Self ─────────────────────────────────────────────────────
function LetterSection({ communityCount }: { communityCount: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayIdx = today.getDay();

  const handleSave = async () => {
    if (!body.trim()) return;
    if (!user) {
      navigate('/sign-in');
      return;
    }
    setSaveError('');
    const { error } = await supabase
      .from('journals')
      .insert({
        user_id: user.id,
        type: 'letter',
        title: title.trim() || 'Untitled',
        content: body.trim(),
        is_public: true,
      });
    if (error) {
      console.error('Failed to save letter:', error);
      setSaveError('Something went wrong. Please try again.');
    } else {
      setSaved(true);
    }
  };

  if (saved) {
    return (
      <div className="space-y-4">
        <div className="bg-[#FEE188]/20 border-2 border-[#FEE188]/60 rounded-2xl p-6">
          <p className="font-comfortaa text-xs text-[#5D8E67]/50 uppercase tracking-widest mb-1">Saved letter</p>
          {title && <h3 className="font-comfortaa font-bold text-[#5D8E67] text-base mb-3">{title}</h3>}
          <p className="font-handwriting text-[#2d4a35] text-lg leading-relaxed whitespace-pre-wrap">{body}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setSaved(false)}
            className="font-comfortaa text-sm text-[#5D8E67]/60 underline hover:text-[#5D8E67] transition-colors"
          >
            Edit letter
          </button>
          <button
            onClick={() => navigate('/notebook')}
            className="font-comfortaa font-semibold text-sm bg-[#5D8E67] text-[#F9F5ED] px-5 py-2 rounded-xl hover:bg-[#4a7255] transition-colors"
          >
            View all my letters →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-comfortaa text-[#5D8E67]/75 text-sm leading-relaxed">
        Write a letter to your future self about what truly matters in your life. What would you want to remind yourself about when you're feeling overwhelmed?
      </p>

      {/* Counter badge */}
      <div className="inline-flex items-center gap-2 bg-[#FEE188]/30 border border-[#FEE188]/70 px-3 py-1.5 rounded-full">
        <Mail size={12} className="text-[#5D8E67]/60" />
        <span className="font-comfortaa font-semibold text-[#5D8E67]/80 text-xs">
          {communityCount.toLocaleString()} letters saved by our community
        </span>
      </div>

      {/* Notebook-style paper */}
      <div className="relative rounded-2xl overflow-hidden border border-[#c8b89a]/60 shadow-md"
        style={{ background: '#faf8f2' }}>

        {/* Spiral binding at top */}
        <div className="flex items-center justify-center gap-3 px-4 pt-3 pb-2 border-b border-[#c8b89a]/40">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full border-2 border-[#9b8c72]/50 bg-[#e8e0d0]" />
          ))}
        </div>

        {/* Date + day row */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <span className="font-mono text-[#5D8E67]/50 text-xs tracking-wider">{dateStr}</span>
          <div className="flex gap-2">
            {days.map((d, i) => (
              <span
                key={d}
                className={`font-mono text-[10px] ${i === todayIdx ? 'text-[#5D8E67] font-bold underline underline-offset-2' : 'text-[#5D8E67]/30'}`}
              >
                {d.charAt(0)}
              </span>
            ))}
          </div>
        </div>

        {/* Title row */}
        <div className="relative z-10 mx-4 mt-2 mb-1 border border-[#5D8E67]/20 rounded bg-[#FFFCF6]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-transparent px-3 py-2 font-mono text-[#2d4a35]/80 text-sm placeholder:text-[#5D8E67]/30 focus:outline-none"
          />
        </div>

        {/* Body area */}
        <div className="relative z-10 mx-4 mb-4 border border-[#5D8E67]/20 rounded bg-[#FFFCF6]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder="Dear Future Me,&#10;&#10;I want you to know..."
            className="w-full bg-transparent px-3 py-3 font-handwriting text-[#2d4a35] text-lg leading-relaxed placeholder:text-[#5D8E67]/30 focus:outline-none resize-none"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', lineHeight: '1.9' }}
          />
        </div>

        {/* Footer row */}
        <div className="relative z-10 flex justify-end px-5 pb-3 gap-2">
          <span className="font-mono text-[#5D8E67]/25 text-xs self-end">{body.length} chars</span>
        </div>
      </div>

      {saveError && (
        <p className="font-comfortaa text-[#3a5c42]/80 text-sm rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-2.5">{saveError}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/notebook')}
          className="font-comfortaa text-xs text-[#5D8E67]/50 hover:text-[#5D8E67] transition-colors underline"
        >
          View my saved letters
        </button>
        <motion.button
          onClick={handleSave}
          disabled={!body.trim()}
          className="font-comfortaa font-semibold text-sm bg-[#5D8E67] text-[#F9F5ED] px-5 py-2 rounded-xl hover:bg-[#4a7255] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
        >
          {user ? 'Save letter' : 'Sign in to save'}
        </motion.button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ExplorePage() {
  const [selectedId, setSelectedId] = useState('non-resume');
  const [communityCount, setCommunityCount] = useState(650);

  useEffect(() => {
    supabase.rpc('count_community_letters').then(({ data, error }) => {
      if (error) console.error('count_community_letters RPC error:', error);
      else if (typeof data === 'number') setCommunityCount(data);
    });
  }, []);

  const activities = [
    {
      id: 'non-resume',
      icon: <Award size={20} />,
      accent: '#FFD1BD',
      iconBg: 'bg-[#FFD1BD]/50',
      tag: 'Personal Growth',
      title: 'Non-Resume Accomplishments',
      subtitle: 'Celebrate what matters beyond the application.',
      body: <NonResumeSection />,
    },
    {
      id: 'vision-board',
      icon: <DfmIconSlot variant="scissors" size="xs" />,
      accent: '#B7E3FF',
      iconBg: 'bg-[#B7E3FF]/50',
      tag: 'Creative',
      title: 'Create Your Vision Board',
      subtitle: 'A visual map of the future you want to grow toward.',
      body: <VisionBoardSection />,
    },
    {
      id: 'letter',
      icon: <Mail size={20} />,
      accent: '#FEE188',
      iconBg: 'bg-[#FEE188]/50',
      tag: 'Reflection',
      title: 'Letter to Your Future Self',
      subtitle: `${communityCount.toLocaleString()} letters saved by our community.`,
      body: <LetterSection communityCount={communityCount} />,
    },
    {
      id: 'draft',
      icon: <DfmIconSlot variant="pencil" size="xs" />,
      accent: '#9FD89C',
      iconBg: 'bg-[#9FD89C]/45',
      tag: 'Private Space',
      title: 'Private Draft Drawer',
      subtitle: 'Keep it for later, or crumple it without losing it forever.',
      body: <CrumpleDraftBin />,
    },
  ];

  const cabinetFiles: CabinetFile[] = [
    {
      id: 'non-resume',
      accent: '#FFD1BD',
      desktopLabel: 'NON-RESUME',
      mobileLabel: 'KEPT',
      preview: 'Keep the wins that mattered even when no application could measure them.',
      tab: 'left',
      title: 'Non-Resume Accomplishments',
    },
    {
      id: 'vision-board',
      accent: '#B7E3FF',
      desktopLabel: 'VISION BOARD',
      mobileLabel: 'LETTERS',
      preview: 'Collect the images, ideas, and possibilities you want to grow toward.',
      tab: 'right',
      title: 'Create Your Vision Board',
    },
    {
      id: 'letter',
      accent: '#FEE188',
      desktopLabel: 'FUTURE LETTER',
      mobileLabel: 'CHATS',
      preview: 'Leave a private message for the version of you who will need it later.',
      tab: 'center',
      title: 'Letter to Your Future Self',
    },
    {
      id: 'draft',
      accent: '#9FD89C',
      desktopLabel: 'DRAFT DRAWER',
      mobileLabel: 'DRAFT',
      preview: 'Write privately, keep what matters, or crumple it into a recoverable bin.',
      tab: 'right',
      title: 'Private Draft Drawer',
    },
  ];

  const selectedActivity = activities.find((activity) => activity.id === selectedId) ?? activities[0];

  return (
    <PageWrapper>
      <div
        className="relative overflow-hidden bg-[#F9F5ED]"
        style={{
          backgroundImage: 'linear-gradient(rgba(93,142,103,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(93,142,103,.065) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="pointer-events-none absolute -left-8 top-12 rotate-[-8deg] opacity-20">
          <DfmIconSlot variant="pencil" size="lg" />
        </div>
        <div className="pointer-events-none absolute -right-6 bottom-12 rotate-[7deg] opacity-20">
          <DfmIconSlot variant="glue" size="lg" />
        </div>

        <MemoryFileCabinet activeId={selectedId} files={cabinetFiles} onSelect={setSelectedId}>
          <div>
            <header className="mb-8 flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[#5D8E67] ${selectedActivity.iconBg}`}>
                {selectedActivity.icon}
              </div>
              <div>
                <p className="font-comfortaa text-[9px] font-bold uppercase tracking-[0.16em] text-[#5D8E67]/45">{selectedActivity.tag} · OPEN FILE</p>
                <h2 className="mt-1 font-comfortaa text-2xl font-bold text-[#3a5c42] sm:text-3xl">{selectedActivity.title}</h2>
                <p className="font-handwriting text-lg text-[#5D8E67]/55">{selectedActivity.subtitle}</p>
              </div>
            </header>
            <div className="h-1 w-full" style={{ backgroundColor: selectedActivity.accent }} />
            <div className="py-8">{selectedActivity.body}</div>
          </div>
        </MemoryFileCabinet>
      </div>
    </PageWrapper>
  );
}
