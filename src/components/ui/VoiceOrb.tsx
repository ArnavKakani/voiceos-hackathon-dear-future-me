import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  className?: string;
  rings?: boolean;
  size?: number;
  state?: VoiceOrbState;
}

/**
 * The exact WebGL orb bundle used by the iOS app's WebOrbView.
 *
 * Both platforms load the same Three.js scene, GLSL shaders, color states,
 * displacement behavior, and bundled attribution. React only sizes the
 * transparent surface and sends the state name that Swift sends in-app.
 */
export function VoiceOrb({ size = 216, className = '', state = 'idle' }: VoiceOrbProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const sendState = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'dfm-voiceorb-state', state },
      window.location.origin,
    );
  }, [state]);

  useEffect(() => {
    sendState();
  }, [sendState]);

  return (
    <motion.div
      className={`relative shrink-0 overflow-visible ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-[7%] rounded-full"
        style={{
          background: state === 'speaking'
            ? 'radial-gradient(circle, rgba(58,92,66,.42), rgba(58,92,66,0) 72%)'
            : 'radial-gradient(circle, rgba(159,216,156,.42), rgba(159,216,156,0) 72%)',
          filter: `blur(${Math.max(2, Math.round(size * 0.08))}px)`,
        }}
      />
      <iframe
        ref={frameRef}
        src="/voiceorb/index.html"
        title="Dear Future Me voice orb"
        onLoad={sendState}
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-transparent"
        style={{ transform: 'scale(1.9)' }}
        sandbox="allow-scripts allow-same-origin"
      />
    </motion.div>
  );
}
