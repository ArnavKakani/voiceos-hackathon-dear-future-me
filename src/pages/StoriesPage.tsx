import { useState, useEffect } from 'react';
import { Send, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { StoryCard } from '../components/ui/StoryCard';
import { Button } from '../components/ui/Button';
import { PageWrapper } from '../components/layout/PageWrapper';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import supabase from '../supabase/client';

const COLORS = ['yellow', 'peach', 'softgreen', 'softblue'] as const;
const ROTATIONS = ['-1deg', '1.5deg', '-0.5deg', '1deg', '-1.5deg', '0.5deg'];

interface Story {
  id: string;
  text: string;
  tags: string[];
  color: typeof COLORS[number];
  rotation: string;
}

export function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [storyText, setStoryText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setLoadingStories(true);
    setFetchError(false);
    async function fetchStories() {
      const { data, error } = await supabase
        .from('testimonials')
        .select('testimonial_id, testimonial_content, tags')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load stories:', error);
        setFetchError(true);
      } else if (data) {
        setStories(
          data.map((row, i) => ({
            id: String(row.testimonial_id),
            text: (row.testimonial_content as string) ?? '',
            tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
            color: COLORS[i % COLORS.length],
            rotation: ROTATIONS[i % ROTATIONS.length],
          }))
        );
      }
      setLoadingStories(false);
    }
    fetchStories();
  }, [retryKey]);

  const handleSubmit = async () => {
    if (!storyText.trim()) return;
    setSubmitError('');
    const { error } = await supabase
      .from('testimonials')
      .insert({ testimonial_content: storyText.trim(), is_approved: false });

    if (error) {
      console.error('Failed to submit story:', error);
      setSubmitError('Something went wrong. Please try again.');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <DfmIconSlot variant="glue" size="lg" />
          </div>
          <span className="inline-block font-handwriting text-[#5D8E67]/70 text-lg mb-4 bg-[#B7E3FF]/30 px-4 py-1 rounded-full border border-[#B7E3FF]/60">
            anonymous · real · yours
          </span>
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-4 leading-tight">
            You're not the only one.
          </h1>
          <p className="font-handwriting text-[#5D8E67]/70 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            Real reflections from students navigating pressure, comparison, burnout, and hope. Every story here was written for you.
          </p>
        </div>

        {/* Story grid */}
        {loadingStories ? (
          <p className="font-comfortaa text-[#5D8E67]/40 text-center py-12">Loading stories…</p>
        ) : fetchError ? (
          <div className="text-center py-12 mb-16">
            <p className="font-comfortaa text-[#5D8E67]/60 text-base mb-3">
              Couldn't load stories right now.
            </p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="font-comfortaa text-sm text-[#5D8E67] border border-[#9FD89C] px-4 py-2 rounded-xl hover:bg-[#9FD89C]/10 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : stories.length === 0 ? (
          <p className="font-comfortaa text-[#5D8E67]/40 text-center py-12 mb-16">
            No stories yet — be the first to share.
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                text={story.text}
                tags={story.tags}
                color={story.color}
                rotation={story.rotation}
              />
            ))}
          </motion.div>
        )}

        {/* Submission card */}
        <motion.div
          className="max-w-2xl mx-auto bg-[#F9F5ED] border-2 border-[#9FD89C] rounded-3xl p-8 shadow-soft"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <h3 className="font-comfortaa font-bold text-[#5D8E67] text-xl mb-2">
            Share something another student might need to hear.
          </h3>
          <p className="font-handwriting text-[#5D8E67]/60 text-base mb-5">
            Anonymous. Honest. No name required. Just what's true for you right now.
          </p>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#9FD89C]/40 border-2 border-[#9FD89C] flex items-center justify-center mx-auto mb-4">
                <Send size={22} className="text-[#5D8E67]" />
              </div>
              <p className="font-comfortaa font-bold text-[#5D8E67] text-lg">Thank you for sharing.</p>
              <p className="font-handwriting text-[#5D8E67]/65 text-base mt-1">Your words will help someone feel less alone.</p>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <div className="absolute left-8 right-8 -top-2 flex justify-between pointer-events-none">
                  <span className="w-12 h-4 rounded-sm bg-[#B7E3FF]/70 border border-[#F9F5ED]/70 rotate-[-6deg]" />
                  <span className="w-10 h-4 rounded-sm bg-[#FFD1BD]/75 border border-[#F9F5ED]/70 rotate-[7deg]" />
                </div>
                <div className="relative bg-[#FEE188]/85 border border-[#E2C96C] rounded-[1.75rem] px-5 py-5 shadow-[0_14px_28px_rgba(93,142,103,0.12)] before:absolute before:right-0 before:top-0 before:h-14 before:w-14 before:rounded-bl-[1.4rem] before:border-b before:border-l before:border-[#E2C96C]/70 before:bg-[#FFF4B4] before:content-['']">
                  <div className="absolute inset-x-5 top-5 h-px bg-[#5D8E67]/10" />
                  <div className="absolute inset-x-5 bottom-5 h-px bg-[#5D8E67]/10" />
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    rows={6}
                    placeholder="Write anonymously…"
                    className="relative z-10 w-full bg-transparent pr-8 font-handwriting text-[#46684D] text-[1.45rem] leading-[1.45] placeholder:text-[#5D8E67]/35 focus:outline-none resize-none"
                  />
                </div>
              </div>
              {submitError && (
                <p className="font-comfortaa text-[#3a5c42]/80 text-sm mb-3 rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 px-4 py-2.5">{submitError}</p>
              )}
              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!storyText.trim()}
              >
                <Send size={16} className="inline mr-2" />
                Share Anonymously
              </Button>
            </>
          )}

          <div className="flex items-start gap-2 mt-5 text-xs font-comfortaa text-[#5D8E67]/50">
            <Shield size={12} className="mt-0.5 flex-shrink-0" />
            <span>Stories are reviewed before appearing publicly. No identifying information is collected.</span>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
