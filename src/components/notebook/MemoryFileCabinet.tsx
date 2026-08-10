import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { MousePointer2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { DfmIconSlot } from '../ui/DfmIconSlot';

export type CabinetFile = {
  accent: string;
  desktopLabel: string;
  id: string;
  mobileLabel: string;
  preview: string;
  tab: 'left' | 'center' | 'right';
  title: string;
};

type MemoryFileCabinetProps = {
  activeId: string;
  children: ReactNode;
  files: CabinetFile[];
  onSelect: (id: string) => void;
};

const slotTop = 34;
const slotStep = 54;
const tabPositions = {
  left: { end: 168, start: 54 },
  center: { end: 316, start: 190 },
  right: { end: 448, start: 334 },
};

function FolderFront({ file }: { file: CabinetFile }) {
  const tab = tabPositions[file.tab];
  return (
    <div className="absolute inset-0 z-10">
      <svg viewBox="0 0 500 160" className="h-full w-full overflow-visible" aria-hidden="true">
        <path d={`M 1 28 H ${tab.start - 24} L ${tab.start} 2 H ${tab.end} L ${tab.end + 24} 28 H 499 V 159 H 1 Z`} fill="#F9F5ED" stroke="#5D8E67" strokeWidth="1.05" vectorEffect="non-scaling-stroke" />
        <path d={`M ${tab.start - 1} 1 H ${tab.end + 1} L ${tab.end + 25} 28 H ${tab.start - 25} Z`} fill={file.accent} stroke="#5D8E67" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute top-[8px] -translate-x-1/2 whitespace-nowrap font-comfortaa text-[7px] font-bold tracking-[0.08em] text-[#3a5c42] sm:text-[8px]" style={{ left: `${((tab.start + tab.end) / 2 / 500) * 100}%` }}>
        <span className="sm:hidden">{file.mobileLabel}</span>
        <span className="hidden sm:inline">{file.desktopLabel}</span>
      </span>
    </div>
  );
}

function FileSheet({ active, file, horizontalMotion, leanMotion }: { active: boolean; file: CabinetFile; horizontalMotion: MotionValue<number>; leanMotion: MotionValue<number> }) {
  return (
    <motion.article
      className="pointer-events-none absolute left-[8%] top-0 z-0 h-[190px] w-[84%] origin-bottom overflow-hidden rounded-t-sm border border-[#5D8E67]/45 bg-[#fffdf8] px-5 py-5 text-[#3a5c42] shadow-[0_18px_40px_rgba(58,92,66,.16)] sm:px-7 sm:py-6"
      style={{ x: horizontalMotion, rotateZ: leanMotion }}
      animate={{ y: active ? -154 : 10, opacity: active ? 1 : 0, scale: active ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.8 }}
      aria-hidden={!active}
    >
      <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: file.accent }} />
      <div className="flex items-center justify-between border-b border-[#5D8E67]/20 pb-3 font-comfortaa text-[7px] font-bold tracking-[0.13em] text-[#5D8E67]/50 sm:text-[8px]">
        <span className="sm:hidden">{file.mobileLabel}</span><span className="hidden sm:inline">{file.desktopLabel}</span><span>HOVERED FILE</span>
      </div>
      <h2 className="mt-4 font-comfortaa text-sm font-bold text-[#3a5c42] sm:text-base">{file.title}</h2>
      <p className="mt-2 font-handwriting text-lg leading-[1.2] text-[#5D8E67]/80 sm:text-xl">{file.preview}</p>
      <p className="absolute bottom-4 left-5 text-[6px] font-bold tracking-[0.13em] text-[#5D8E67]/35 sm:left-7 sm:text-[7px]">TAP TO OPEN IN THE NOTEBOOK</p>
    </motion.article>
  );
}

export function MemoryFileCabinet({ activeId, children, files, onSelect }: MemoryFileCabinetProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cabinetRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 190, damping: 24, mass: 0.65 });
  const sheetX = useTransform(smoothX, [-1, 1], [-17, 17]);
  const sheetLean = useTransform(smoothX, [-1, 1], [-2.2, 2.2]);
  const cabinetX = useTransform(smoothX, [-1, 1], [-5, 5]);
  const cabinetTilt = useTransform(smoothX, [-1, 1], [-0.8, 0.8]);
  const selectedIndex = Math.max(0, files.findIndex((file) => file.id === activeId));
  const selectedFile = files[selectedIndex] ?? files[0];
  const cabinetFrontTop = slotTop + files.length * slotStep;
  const cabinetHeight = cabinetFrontTop + 190;

  const selectFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = cabinetRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const index = Math.floor((event.clientY - bounds.top - slotTop) / slotStep);
    pointerX.set(Math.max(-1, Math.min(1, normalizedX)));
    setHoveredIndex(index >= 0 && index < files.length ? index : null);
  };

  return (
    <section className="mx-auto min-h-[calc(100svh-3.5rem)] w-full max-w-[1540px] px-3 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(380px,.82fr)_minmax(0,1.38fr)] lg:gap-10 xl:grid-cols-[minmax(460px,.9fr)_minmax(0,1.45fr)] xl:gap-14">
        <div className="relative z-20 min-w-0 lg:sticky lg:top-20">
          <div className="mb-7 max-w-xl lg:mb-4 lg:pr-10">
            <p className="font-handwriting text-2xl text-[#5D8E67]/60 sm:text-3xl">everything you have carried</p>
            <h1 className="mt-2 font-comfortaa text-3xl font-bold leading-[1.08] text-[#3a5c42] sm:text-4xl xl:text-5xl">One notebook. Every way in.</h1>
            <p className="mt-4 max-w-md font-comfortaa text-xs leading-6 text-[#5D8E67]/60 sm:text-sm">Move across the original file tabs, then choose one. The notebook page changes in place—nothing floats away from the organizer.</p>
          </div>

          <div className="relative min-h-[600px] w-full [perspective:1200px] sm:min-h-[640px]">
            <div className="absolute inset-x-0 top-0 text-center lg:pr-8"><p className="font-handwriting text-xl text-[#5D8E67]/55 sm:text-2xl">move across the tabs · tap to open one</p></div>
            <div className="absolute left-1/2 top-[170px] w-[94%] max-w-[610px] -translate-x-1/2 lg:left-[46%] lg:w-full" style={{ height: cabinetHeight }}>
              <motion.div ref={cabinetRef} className="relative h-full w-full touch-pan-y" style={{ x: cabinetX, rotateY: cabinetTilt }} onPointerMove={selectFromPointer} onPointerLeave={() => { pointerX.set(0); setHoveredIndex(null); }}>
                {files.map((file, index) => (
                  <div key={file.id} className="absolute inset-x-0 h-[160px]" style={{ top: slotTop + index * slotStep, zIndex: 20 + index }}>
                    <FileSheet active={hoveredIndex === index} file={file} horizontalMotion={sheetX} leanMotion={sheetLean} />
                    <FolderFront file={file} />
                    <button
                      type="button"
                      className="absolute inset-x-0 top-0 z-20 h-[54px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D8E67]"
                      onFocus={() => setHoveredIndex(index)}
                      onBlur={() => setHoveredIndex(null)}
                      onClick={(event) => { onSelect(file.id); setHoveredIndex(null); event.currentTarget.blur(); }}
                      aria-pressed={activeId === file.id}
                      aria-label={`Open ${file.title}`}
                    />
                  </div>
                ))}
                <div className="absolute inset-x-0 z-[70] flex h-[188px] items-center justify-between border border-[#5D8E67] bg-[#ece8de] px-7 shadow-[0_-12px_30px_rgba(58,92,66,.08)] sm:px-10" style={{ top: cabinetFrontTop }}>
                  <div><p className="text-[8px] font-bold tracking-[0.18em] text-[#5D8E67]/45">EXPLORE NOTEBOOK · {files.length} FILES</p><p className="mt-2 font-handwriting text-2xl text-[#3a5c42] sm:text-3xl">everything stays within reach</p></div>
                  <DfmIconSlot variant="notebook" size="sm" className="opacity-55" />
                </div>
              </motion.div>
            </div>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[7px] font-bold tracking-[0.13em] text-[#5D8E67]/40 sm:text-[8px] lg:left-[46%]"><MousePointer2 size={12} /> CURSOR REACTIVE · TOUCH READY</div>
          </div>
        </div>

        <motion.div key={activeId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="relative z-10 min-w-0 overflow-hidden border border-[#5D8E67]/55 bg-[#fffdf8] shadow-[0_24px_70px_rgba(58,92,66,.14)] lg:min-h-[calc(100svh-9rem)]" aria-live="polite">
          <div className="h-2 w-full" style={{ backgroundColor: selectedFile.accent }} />
          <div className="flex items-center justify-between border-b border-[#5D8E67]/20 px-5 py-3 font-comfortaa text-[8px] font-bold tracking-[0.16em] text-[#5D8E67]/45 sm:px-8"><span>{selectedFile.desktopLabel}</span><span>OPEN NOTEBOOK FILE</span></div>
          <div className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">{children}</div>
        </motion.div>
      </div>
    </section>
  );
}
