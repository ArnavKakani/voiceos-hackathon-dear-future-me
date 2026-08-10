import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LogoSlot } from '../components/ui/LogoSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: resetError } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <PageWrapper>
      <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8 sm:py-12">
        <section className="w-full max-w-md rounded-[1.75rem] border-2 border-[#9FD89C]/60 bg-[#F9F5ED] p-5 shadow-card sm:p-9">
          <div className="mb-6 flex justify-center"><LogoSlot size="lg" /></div>
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FD89C]/30 text-[#3a5c42]"><Mail size={24} /></div>
              <h1 className="mt-5 font-comfortaa text-2xl font-bold text-[#3a5c42]">Check your email.</h1>
              <p className="mt-3 font-comfortaa text-sm leading-6 text-[#5D8E67]/70">If this address has an older password account, Supabase sent a secure reset link to <strong>{email}</strong>.</p>
              <Link to="/sign-in" className="mt-7 inline-flex items-center gap-2 font-comfortaa text-sm font-semibold text-[#5D8E67] underline underline-offset-4"><ArrowLeft size={14} /> Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-center font-comfortaa text-2xl font-bold text-[#3a5c42]">Reset an old password.</h1>
              <p className="mb-7 mt-3 text-center font-comfortaa text-sm leading-6 text-[#5D8E67]/70">New sign-ins use magic links. This is only for accounts that previously used a password.</p>
              {error && <div className="mb-4 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-3 font-comfortaa text-sm text-[#3a5c42]/80" role="alert">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block font-comfortaa text-sm font-semibold text-[#5D8E67]">Email</label>
                  <input id="reset-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" className="w-full rounded-xl border-2 border-[#9FD89C]/60 bg-[#F9F5ED] px-4 py-3.5 font-comfortaa text-base text-[#3a5c42] outline-none placeholder:text-[#5D8E67]/30 focus:border-[#5D8E67]" />
                </div>
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>{loading ? 'Sending reset link…' : 'Send password reset link'}</Button>
              </form>
              <Link to="/sign-in" className="mt-6 flex items-center justify-center gap-2 font-comfortaa text-xs font-semibold text-[#5D8E67]/70 underline underline-offset-4"><ArrowLeft size={13} /> Back to magic-link sign in</Link>
            </>
          )}
        </section>
      </main>
    </PageWrapper>
  );
}
