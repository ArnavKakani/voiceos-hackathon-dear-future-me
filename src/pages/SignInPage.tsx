import { Star } from 'lucide-react';
import { MagicLinkAuthCard } from '../components/auth/MagicLinkAuthCard';
import { PageWrapper } from '../components/layout/PageWrapper';

export function SignInPage() {
  return (
    <PageWrapper>
      <main className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
        <Star className="absolute left-7 top-12 text-[#FEE188] opacity-40 sm:left-12 sm:top-16" size={24} fill="#FEE188" />
        <Star className="absolute bottom-16 right-8 text-[#FEE188] opacity-30 sm:bottom-20 sm:right-16" size={18} fill="#FEE188" />
        <div className="absolute right-0 top-1/3 h-28 w-28 rounded-full bg-[#9FD89C]/15 blur-3xl" />
        <div className="absolute bottom-1/3 left-0 h-32 w-32 rounded-full bg-[#FFD1BD]/20 blur-3xl" />
        <MagicLinkAuthCard mode="sign-in" />
      </main>
    </PageWrapper>
  );
}
