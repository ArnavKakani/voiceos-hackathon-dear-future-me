import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { SurveyActionCard } from '../components/ui/SurveyActionCard';
import { Button } from '../components/ui/Button';
import { PageWrapper } from '../components/layout/PageWrapper';
import { POST_SURVEY_URL } from '../data';

export function CheckOutPage() {
  const navigate = useNavigate();
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <PageWrapper>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#9FD89C]/40 border-2 border-[#9FD89C] flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-[#5D8E67]" />
          </div>
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl mb-3 leading-tight">
            You made space for yourself today.
          </h2>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl mb-2 leading-relaxed">
            That counts. It always did.
          </p>
          <p className="font-comfortaa text-[#5D8E67]/55 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Students who completed a reflection saw their average anxiety score drop from 3.95 to 3.32.
            You just added to that.
          </p>
          {reflection && (
            <div className="mt-4 mb-8 bg-[#FEE188]/30 border-2 border-[#FEE188] rounded-2xl p-5 text-left">
              <p className="font-comfortaa text-[9px] text-[#5D8E67]/50 uppercase tracking-wider mb-2">something you wanted to remember</p>
              <p className="font-handwriting text-[#5D8E67] text-lg leading-relaxed">
                "{reflection}"
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="ghost" onClick={() => navigate('/stories')}>
              Read Community Stories
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

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
          <Sparkles className="mx-auto text-[#5D8E67] mb-4 animate-sparkle" size={28} />
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-4 leading-tight">
            How do you feel now?
          </h1>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl max-w-lg mx-auto leading-relaxed">
            Take one minute to notice what changed since you checked in.
          </p>
        </div>

        {/* Survey action card */}
        <SurveyActionCard
          title="Post-Reflection Check-In"
          description="A few quick questions about how today's reflection landed. Anonymous, honest, and under 2 minutes."
          primaryLabel="Open Post-Reflection Survey"
          secondaryLabel="Finish Journey"
          onPrimary={() => window.open(POST_SURVEY_URL, '_blank', 'noopener,noreferrer')}
          onSecondary={() => setCompleted(true)}
        />

        {/* Optional reflection input */}
        <div className="mt-10 max-w-lg mx-auto">
          <label className="block font-comfortaa font-semibold text-[#5D8E67] text-sm mb-2">
            One thing I want to remember is…
          </label>
          <p className="font-handwriting text-[#5D8E67]/50 text-base mb-3">
            This stays with you. It's not shared anywhere.
          </p>
          <div className="bg-[#F9F5ED] border-2 border-[#9FD89C]/60 rounded-2xl overflow-hidden bg-lined">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder="Write something small. Just for you."
              className="w-full bg-transparent px-5 py-4 font-handwriting text-[#5D8E67] text-lg placeholder:text-[#5D8E67]/30 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCompleted(true)}
            >
              Save & Finish
            </Button>
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
