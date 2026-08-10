import { Sparkles, Star } from 'lucide-react';
import { MagicLinkAuthCard } from '../components/auth/MagicLinkAuthCard';
import { PageWrapper } from '../components/layout/PageWrapper';

export function SignUpPage() {
  return (
    <PageWrapper>
      <main className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
        <Star className="absolute right-8 top-10 text-[#FEE188] opacity-40 sm:right-16 sm:top-12" size={26} fill="#FEE188" />
        <Star className="absolute bottom-14 left-7 text-[#FEE188] opacity-35 sm:bottom-16 sm:left-12" size={18} fill="#FEE188" />
        <Sparkles className="absolute left-8 top-1/3 text-[#9FD89C] opacity-40 sm:left-1/4" size={16} />
        <div className="absolute bottom-1/4 right-0 h-28 w-28 rounded-full bg-[#FEE188]/20 blur-3xl" />
        <MagicLinkAuthCard mode="sign-up" />
      </main>
    </PageWrapper>
  );
}
