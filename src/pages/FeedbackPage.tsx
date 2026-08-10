import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import supabase from '../supabase/client';

const categories = [
  { id: 'liked', label: 'Something I liked', placeholder: 'What worked really well for you?', accent: 'border-[#9FD89C] bg-[#9FD89C]/10' },
  { id: 'confused', label: 'Something that confused me', placeholder: 'What felt unclear or hard to navigate?', accent: 'border-[#FEE188] bg-[#FEE188]/10' },
  { id: 'wish', label: 'Something I wish existed', placeholder: 'What would make this more helpful?', accent: 'border-[#B7E3FF] bg-[#B7E3FF]/15' },
  { id: 'story', label: 'A story I want to share', placeholder: 'Tell us something that might help others...', accent: 'border-[#FFD1BD] bg-[#FFD1BD]/15' },
  { id: 'bug', label: 'Bug or technical issue', placeholder: 'What went wrong? Where?', accent: 'border-[#5D8E67]/30 bg-[#5D8E67]/5' },
];

export function FeedbackPage() {
  const [activeCategory, setActiveCategory] = useState('liked');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentCategory = categories.find((c) => c.id === activeCategory)!;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setError('');
    setLoading(true);
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({ feedback_content: text.trim(), category: activeCategory });
    setLoading(false);

    if (insertError) {
      console.error('Failed to submit feedback:', insertError);
      setError('Something went wrong. Please try again.');
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <PageWrapper>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#9FD89C]/40 border-2 border-[#9FD89C] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-[#5D8E67]" />
          </div>
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl mb-3 leading-tight">
            Thank you for your feedback.
          </h2>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl mb-8 leading-relaxed">
            Every note you share helps us build something more useful,
            more honest, and more human.
          </p>
          <Button variant="primary" onClick={() => { setSubmitted(false); setText(''); setError(''); }}>
            Submit Another
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <DfmIconSlot variant="pencil" size="lg" />
          </div>
          <span className="inline-block font-handwriting text-[#5D8E67]/70 text-lg mb-4 bg-[#FFD1BD]/30 px-4 py-1 rounded-full border border-[#FFD1BD]/60">
            we actually read these
          </span>
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-4 leading-tight">
            Help us make this softer,<br />safer, and more useful.
          </h1>
          <p className="font-handwriting text-[#5D8E67]/65 text-lg max-w-md mx-auto leading-relaxed">
            Your feedback shapes the next version of Dear Future Me. Every message helps.
          </p>
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setText(''); setError(''); }}
              className={`
                px-4 py-2 rounded-full text-sm font-comfortaa font-semibold border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-[#5D8E67]
                ${activeCategory === cat.id
                  ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]'
                  : 'bg-[#F9F5ED] text-[#5D8E67] border-[#9FD89C]/60 hover:border-[#5D8E67]'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className={`border-2 rounded-3xl p-6 sm:p-8 ${currentCategory.accent}`}>
          <h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-2">
            {currentCategory.label}
          </h3>
          <p className="font-handwriting text-[#5D8E67]/60 text-base mb-5">
            Honest and specific is most helpful. Short is fine too.
          </p>
          <div className="bg-[#F9F5ED] border-2 border-[#9FD89C]/50 rounded-2xl overflow-hidden bg-lined mb-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={currentCategory.placeholder}
              className="w-full bg-transparent px-5 py-4 font-handwriting text-[#5D8E67] text-lg placeholder:text-[#5D8E67]/30 focus:outline-none resize-none"
            />
          </div>
          {error && (
            <p className="font-comfortaa text-[#3a5c42]/80 text-sm mb-3 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-2.5">{error}</p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!text.trim() || loading}
            onClick={handleSubmit}
          >
            <Send size={16} className="inline mr-2" />
            {loading ? 'Sending…' : 'Send Feedback'}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
