import { useRef, useState } from 'react';
import { ArchiveRestore, Check, RotateCcw, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

type StoredDraft = {
  id: string;
  text: string;
  timestamp: number;
};

const KEPT_KEY = 'dfm-kept-drafts';
const BIN_KEY = 'dfm-crumpled-drafts';

function readDrafts(key: string): StoredDraft[] {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as StoredDraft[] : [];
  } catch {
    return [];
  }
}

function writeDrafts(key: string, drafts: StoredDraft[]) {
  window.localStorage.setItem(key, JSON.stringify(drafts));
}

export function CrumpleDraftBin() {
  const [draft, setDraft] = useState('');
  const [crumpling, setCrumpling] = useState(false);
  const [kept, setKept] = useState<StoredDraft[]>(() => readDrafts(KEPT_KEY));
  const [bin, setBin] = useState<StoredDraft[]>(() => readDrafts(BIN_KEY));
  const [binOpen, setBinOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const store = (key: string, drafts: StoredDraft[], update: (value: StoredDraft[]) => void) => {
    writeDrafts(key, drafts);
    update(drafts);
  };

  const finishCrumple = () => {
    if (draft.trim()) {
      const next = [{ id: crypto.randomUUID(), text: draft.trim(), timestamp: Date.now() }, ...bin];
      store(BIN_KEY, next, setBin);
    }
    setDraft('');
    setCrumpling(false);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const crumple = () => {
    if (!draft.trim() || crumpling) return;
    setCrumpling(true);
    const video = videoRef.current;
    if (!video) {
      window.setTimeout(finishCrumple, 900);
      return;
    }
    video.currentTime = 0;
    video.play().catch(() => window.setTimeout(finishCrumple, 900));
  };

  const keep = () => {
    if (!draft.trim()) return;
    const next = [{ id: crypto.randomUUID(), text: draft.trim(), timestamp: Date.now() }, ...kept];
    store(KEPT_KEY, next, setKept);
    setDraft('');
  };

  const restore = (item: StoredDraft) => {
    setDraft(item.text);
    const next = bin.filter((entry) => entry.id !== item.id);
    store(BIN_KEY, next, setBin);
    setBinOpen(false);
  };

  const deleteForever = (id: string) => {
    const next = bin.filter((entry) => entry.id !== id);
    store(BIN_KEY, next, setBin);
  };

  return (
    <div className="relative mx-auto min-h-[520px] w-full max-w-none overflow-hidden rounded-[1.75rem] bg-[#173f35] p-5 shadow-[0_30px_90px_rgba(23,63,53,0.25)] sm:min-h-[620px] sm:p-8">
      <video
        ref={videoRef}
        src="/media/paper-crumple-clean.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={finishCrumple}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= 1.22) {
            event.currentTarget.pause();
            finishCrumple();
          }
        }}
        className={`pointer-events-none absolute inset-x-5 top-[58px] z-10 h-[360px] w-[calc(100%_-_2.5rem)] object-cover object-center transition-opacity duration-75 sm:inset-x-8 sm:top-[62px] sm:h-[460px] sm:w-[calc(100%_-_4rem)] ${crumpling ? 'opacity-100' : 'opacity-0'}`}
        style={{
          mixBlendMode: 'screen',
          clipPath: 'inset(0 0 11% 0)',
          filter: 'contrast(2.15) brightness(1.08)',
          transform: 'translate(5px, 1px)',
        }}
        aria-hidden="true"
      />

      <div className="mb-5 flex items-center justify-between text-[#F9F5ED]/65">
        <span className="text-[9px] font-bold tracking-[0.18em] sm:text-[10px]">PRIVATE DRAFT</span>
        <button
          type="button"
          onClick={() => setBinOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#F9F5ED]/20 px-3 py-1.5 text-[8px] font-bold tracking-[0.12em] text-[#F9F5ED]/65 hover:bg-[#F9F5ED]/10"
        >
          <Trash2 size={11} /> BIN · {bin.length}
        </button>
      </div>

      <motion.div
        className="relative z-20 mx-auto min-h-[360px] w-[86%] max-w-[420px] bg-[#fffdf8] px-5 pb-16 pt-8 shadow-[0_14px_45px_rgba(4,30,23,0.3)] sm:min-h-[455px] sm:px-7 sm:pt-10"
        style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(93,142,103,0.13) 31px, rgba(93,142,103,0.13) 32px)' }}
        animate={{ opacity: crumpling ? 0 : 1, rotateY: crumpling ? 8 : 0, scale: crumpling ? 0.92 : 1 }}
        transition={{ duration: crumpling ? 0.1 : 0.24, ease: 'easeOut' }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Start writing…"
          disabled={crumpling}
          className="h-64 w-full resize-none bg-transparent font-handwriting text-2xl leading-8 text-[#3a5c42] outline-none placeholder:text-[#5D8E67]/30 sm:h-[340px] sm:text-3xl sm:leading-9"
          aria-label="Private reflection draft"
        />
        <div className="absolute inset-x-7 bottom-5 flex items-end justify-between gap-3">
          <span className="text-[8px] font-bold tracking-[0.12em] text-[#5D8E67]/40">{draft.length} CHARACTERS</span>
          <span className="text-right font-handwriting text-sm text-[#5D8E67]/45">nothing saves until you decide</span>
        </div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={crumple}
          disabled={!draft.trim() || crumpling}
          className="flex items-center gap-2 rounded-full border border-[#F9F5ED]/25 px-4 py-2.5 text-xs font-semibold text-[#F9F5ED]/80 transition-colors hover:bg-[#F9F5ED]/10 disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9F5ED]"
        >
          <RotateCcw size={14} /> Crumple to bin
        </button>
        <button
          type="button"
          onClick={keep}
          disabled={!draft.trim() || crumpling}
          className="flex items-center gap-2 rounded-full bg-[#FEE188] px-4 py-2.5 text-xs font-bold text-[#3a5c42] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9F5ED]"
        >
          Keep for later <Check size={14} />
        </button>
      </div>
      <p className="mt-4 text-center text-[8px] font-bold tracking-[0.13em] text-[#F9F5ED]/35">{kept.length} KEPT · CRUMPLED DRAFTS STAY RECOVERABLE</p>

      {binOpen && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#102f27]/95 p-5 text-[#F9F5ED] sm:p-8">
          <div className="flex items-center justify-between border-b border-[#F9F5ED]/15 pb-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.18em] text-[#9FD89C]">RECOVERABLE BIN</p>
              <p className="mt-1 font-handwriting text-xl text-[#F9F5ED]/75">things you let go of, for now</p>
            </div>
            <button type="button" onClick={() => setBinOpen(false)} className="rounded-full border border-[#F9F5ED]/20 p-2 hover:bg-[#F9F5ED]/10" aria-label="Close bin">
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
            {bin.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center font-handwriting text-xl text-[#F9F5ED]/40">the bin is empty</div>
            ) : bin.map((item) => (
              <article key={item.id} className="border border-[#F9F5ED]/15 bg-[#F9F5ED]/5 p-4">
                <p className="line-clamp-3 font-handwriting text-xl leading-6 text-[#F9F5ED]/75">{item.text}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[7px] tracking-[0.12em] text-[#F9F5ED]/30">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => restore(item)} className="flex items-center gap-1.5 rounded-full border border-[#9FD89C]/35 px-3 py-1.5 text-[8px] font-bold text-[#9FD89C] hover:bg-[#9FD89C]/10">
                      <ArchiveRestore size={11} /> RESTORE
                    </button>
                    <button type="button" onClick={() => deleteForever(item.id)} className="rounded-full border border-[#F9F5ED]/15 p-1.5 text-[#F9F5ED]/35 hover:border-[#FFD1BD]/40 hover:text-[#FFD1BD]" aria-label="Delete permanently">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
