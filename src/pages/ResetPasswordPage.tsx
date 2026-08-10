import { useState } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LogoSlot } from '../components/ui/LogoSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAuth } from '../context/AuthContext';

export function ResetPasswordPage() {
  const { loading: authLoading, session, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setComplete(true);
  };

  return (
    <PageWrapper>
      <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8 sm:py-12">
        <section className="w-full max-w-md rounded-[1.75rem] border-2 border-[#9FD89C]/60 bg-[#F9F5ED] p-5 shadow-card sm:p-9">
          <div className="mb-6 flex justify-center"><LogoSlot size="lg" /></div>
          {complete ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FD89C]/35 text-[#3a5c42]"><Check size={25} /></div>
              <h1 className="mt-5 font-comfortaa text-2xl font-bold text-[#3a5c42]">Password updated.</h1>
              <p className="mt-3 font-comfortaa text-sm leading-6 text-[#5D8E67]/70">Your older account is recovered. You can use magic links for future sign-ins.</p>
              <Link to="/notebook" className="mt-7 inline-block rounded-xl bg-[#5D8E67] px-5 py-3 font-comfortaa text-sm font-semibold text-[#F9F5ED]">Open my notebook</Link>
            </div>
          ) : authLoading ? (
            <div className="py-8 text-center">
              <p className="font-handwriting text-xl text-[#5D8E67]/70">opening your secure reset link…</p>
            </div>
          ) : !session ? (
            <div className="text-center">
              <h1 className="font-comfortaa text-2xl font-bold text-[#3a5c42]">This reset link is no longer active.</h1>
              <p className="mt-3 font-comfortaa text-sm leading-6 text-[#5D8E67]/70">Request a fresh password reset email, or use the new magic-link sign in.</p>
              <div className="mt-7 flex flex-col gap-3">
                <Link to="/forgot-password" className="rounded-xl bg-[#5D8E67] px-5 py-3 font-comfortaa text-sm font-semibold text-[#F9F5ED]">Request another reset link</Link>
                <Link to="/sign-in" className="font-comfortaa text-xs font-semibold text-[#5D8E67] underline underline-offset-4">Use magic-link sign in</Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-center font-comfortaa text-2xl font-bold text-[#3a5c42]">Choose a new password.</h1>
              <p className="mb-7 mt-3 text-center font-comfortaa text-sm leading-6 text-[#5D8E67]/70">This updates your older password account. Future sign-ins can still use a magic link.</p>
              {error && <div className="mb-4 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-3 font-comfortaa text-sm text-[#3a5c42]/80" role="alert">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block font-comfortaa text-sm font-semibold text-[#5D8E67]">New password</label>
                  <input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border-2 border-[#9FD89C]/60 bg-[#F9F5ED] px-4 py-3.5 font-comfortaa text-base text-[#3a5c42] outline-none focus:border-[#5D8E67]" />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block font-comfortaa text-sm font-semibold text-[#5D8E67]">Confirm password</label>
                  <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border-2 border-[#9FD89C]/60 bg-[#F9F5ED] px-4 py-3.5 font-comfortaa text-base text-[#3a5c42] outline-none focus:border-[#5D8E67]" />
                </div>
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>{loading ? 'Updating password…' : 'Update password'}</Button>
              </form>
            </>
          )}
        </section>
      </main>
    </PageWrapper>
  );
}
