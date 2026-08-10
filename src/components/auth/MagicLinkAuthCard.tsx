import { useState } from 'react';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { LogoSlot } from '../ui/LogoSlot';

type MagicLinkAuthCardProps = {
  mode: 'sign-in' | 'sign-up';
};

export function MagicLinkAuthCard({ mode }: MagicLinkAuthCardProps) {
  const { sendMagicLink } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'sign-up';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error: authError } = await sendMagicLink(normalizedEmail, isSignUp, name);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSentTo(normalizedEmail);
  };

  return (
    <motion.div
      className="relative z-10 w-full max-w-md rounded-[1.75rem] border-2 border-[#9FD89C]/60 bg-[#F9F5ED] p-5 shadow-card sm:p-9"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-6 flex justify-center sm:mb-8">
        <LogoSlot size="lg" />
      </div>

      {sentTo ? (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FD89C]/35 text-[#3a5c42]">
            <Mail size={25} />
          </div>
          <h1 className="mt-5 font-comfortaa text-2xl font-bold text-[#3a5c42]">Check your email.</h1>
          <p className="mt-3 font-comfortaa text-sm leading-6 text-[#5D8E67]/70">
            We sent a secure sign-in link to <strong className="text-[#3a5c42]">{sentTo}</strong>. Open it on this phone or computer to continue.
          </p>
          <p className="mt-4 font-handwriting text-lg text-[#5D8E67]/60">no password to remember</p>
          <button
            type="button"
            onClick={() => setSentTo('')}
            className="mt-7 font-comfortaa text-xs font-semibold text-[#5D8E67] underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-center font-comfortaa text-2xl font-bold text-[#3a5c42]">
            {isSignUp ? 'Create your private notebook.' : 'Welcome back.'}
          </h1>
          <p className="mb-7 mt-2 text-center font-handwriting text-lg text-[#5D8E67]/60">
            {isSignUp ? 'One email link, then the space is yours.' : 'Your notebook is one secure link away.'}
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-3 font-comfortaa text-sm leading-5 text-[#3a5c42]/80" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block font-comfortaa text-sm font-semibold text-[#5D8E67]">Name or nickname</label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="What should we call you?"
                  className="w-full rounded-xl border-2 border-[#9FD89C]/60 bg-[#F9F5ED] px-4 py-3.5 font-comfortaa text-base text-[#3a5c42] outline-none transition-colors placeholder:text-[#5D8E67]/30 focus:border-[#5D8E67]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block font-comfortaa text-sm font-semibold text-[#5D8E67]">Email</label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                className="w-full rounded-xl border-2 border-[#9FD89C]/60 bg-[#F9F5ED] px-4 py-3.5 font-comfortaa text-base text-[#3a5c42] outline-none transition-colors placeholder:text-[#5D8E67]/30 focus:border-[#5D8E67]"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              <span className="flex items-center justify-center gap-2">
                {loading ? 'Sending secure link…' : isSignUp ? 'Email me a sign-up link' : 'Email me a sign-in link'}
                {!loading && <ArrowRight size={16} />}
              </span>
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#9FD89C]/10 px-3 py-3 font-comfortaa text-[11px] leading-5 text-[#5D8E67]/65">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>Supabase sends a one-time link. It expires automatically and can only be used to access your account.</span>
          </div>

          {isSignUp ? (
            <p className="mt-6 text-center font-comfortaa text-sm text-[#5D8E67]/60">
              Already have a notebook? <Link to="/sign-in" className="font-semibold text-[#5D8E67] underline-offset-4 hover:underline">Sign in</Link>
            </p>
          ) : (
            <div className="mt-6 space-y-3 text-center font-comfortaa text-sm text-[#5D8E67]/60">
              <p>New here? <Link to="/sign-up" className="font-semibold text-[#5D8E67] underline-offset-4 hover:underline">Create an account</Link></p>
              <Link to="/forgot-password" className="inline-block text-xs text-[#5D8E67]/65 underline underline-offset-4 hover:text-[#3a5c42]">Forgot your old password?</Link>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
