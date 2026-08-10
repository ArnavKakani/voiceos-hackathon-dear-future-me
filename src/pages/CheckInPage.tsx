import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { SurveyActionCard } from '../components/ui/SurveyActionCard';
import { PageWrapper } from '../components/layout/PageWrapper';
import dfmLogo from '../assets/icons/dfm_logo_main.png';
import { PRE_SURVEY_URL } from '../data';

const privacyFeatures = [
  { icon: <Shield size={16} />, text: 'All responses are anonymous — no names, no grades attached' },
  { icon: <Eye size={16} />, text: 'No judgment, no right answers, no scores' },
  { icon: <Star size={16} />, text: 'Built on real data from 1,109 students like you' },
  { icon: <Star size={16} />, text: 'You can skip any question and continue as a guest' },
];

export function CheckInPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 py-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >

        {/* Header */}
        <div className="text-center mb-12">
          <img src={dfmLogo} alt="Dear Future Me" className="w-20 h-20 object-contain mx-auto mb-4" />
          <span className="inline-block font-handwriting text-[#5D8E67]/70 text-lg mb-4 bg-[#9FD89C]/20 px-4 py-1 rounded-full border border-[#9FD89C]/40">
            step 1 of your journey
          </span>
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-4 leading-tight">
            Before you begin,<br />check in with yourself.
          </h1>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl max-w-xl mx-auto leading-relaxed">
            This is not a test. It's a moment to notice what you're carrying before anything else.
          </p>
        </div>

        {/* Survey action card */}
        <SurveyActionCard
          title="How are you feeling right now?"
          description="A few quick, honest questions before you start. Under 2 minutes. No right answers — just you, noticing yourself."
          primaryLabel="Open Check-In Survey"
          secondaryLabel="I Finished, Continue"
          onPrimary={() => window.open(PRE_SURVEY_URL, '_blank', 'noopener,noreferrer')}
          onSecondary={() => navigate('/explore')}
        />

        {/* Privacy card */}
        <div className="mt-8 bg-[#B7E3FF]/30 border-2 border-[#B7E3FF] rounded-2xl p-6 max-w-lg mx-auto">
          <h3 className="font-comfortaa font-bold text-[#5D8E67] text-base mb-4 flex items-center gap-2">
            <Shield size={18} /> Your privacy is protected
          </h3>
          <ul className="flex flex-col gap-2.5">
            {privacyFeatures.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-comfortaa text-[#5D8E67]/80">
                <span className="text-[#5D8E67]/60 flex-shrink-0 mt-0.5">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Skip note */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/explore')}
            className="font-handwriting text-[#5D8E67]/50 text-base underline underline-offset-2 hover:text-[#5D8E67]/80 transition-colors"
          >
            Skip for now and explore activities →
          </button>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
