import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText, Award, ChevronRight, LogIn, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageWrapper } from '../components/layout/PageWrapper';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import supabase from '../supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
type EntryType = 'letter' | 'note' | 'accomplishment';

interface Entry {
  id: string;
  type: EntryType;
  title: string;
  body: string;
  date: string;
  dayOfWeek: string;
}

const TYPE_META: Record<EntryType, { label: string; icon: React.ReactNode; color: string; border: string }> = {
  letter: { label: 'Letter', icon: <DfmIconSlot variant="logo" size="xs" />, color: 'bg-[#FEE188]/40', border: 'border-[#FEE188]' },
  note: { label: 'Note', icon: <FileText size={14} />, color: 'bg-[#9FD89C]/25', border: 'border-[#9FD89C]' },
  accomplishment: { label: 'Accomplishment', icon: <Award size={14} />, color: 'bg-[#FFD1BD]/40', border: 'border-[#FFD1BD]' },
};

function toDayKey(iso: string): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso).getDay()];
}

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Grid-paper editor ─────────────────────────────────────────────────────────
function NotebookEditor({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: Entry;
  onUpdate: (updated: Entry) => void;
  onDelete: () => void;
}) {
  const [localTitle, setLocalTitle] = useState(entry.title);
  const [localBody, setLocalBody] = useState(entry.body);
  const [showDelete, setShowDelete] = useState(false);
  const days = ['s', 'm', 't', 'w', 't', 'f', 's'];
  const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const todayIdx = dayMap[entry.dayOfWeek] ?? new Date().getDay();

  const meta = TYPE_META[entry.type];

  useEffect(() => {
    setLocalTitle(entry.title);
    setLocalBody(entry.body);
  }, [entry.id]);

  const handleBlur = () => {
    onUpdate({ ...entry, title: localTitle, body: localBody });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#c8b89a]/40 bg-[#f5f1e8] flex-shrink-0">
        <div className={`flex items-center gap-1.5 text-xs font-comfortaa font-semibold text-[#5D8E67]/70 px-2.5 py-1 rounded-full border ${meta.color} ${meta.border}`}>
          {meta.icon} {meta.label}
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="p-1.5 rounded-lg text-[#5D8E67]/30 hover:text-[#5D8E67] hover:bg-[#FFD1BD]/40 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Paper area */}
      <div className="flex-1 overflow-y-auto relative" style={{ background: '#faf8f2' }}>
        {/* Spiral rings */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-[#c8b89a]/30">
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full border-[1.5px] border-[#9b8c72]/45 bg-[#e4ddd0]" />
          ))}
        </div>

        {/* Date + day dots */}
        <div className="flex items-center justify-between px-6 pt-2 pb-1">
          <span className="font-mono text-[#5D8E67]/40 text-[11px] tracking-widest">date {entry.date}</span>
          <div className="flex gap-2">
            {days.map((d, i) => (
              <span
                key={i}
                className={`font-mono text-[10px] ${i === todayIdx ? 'text-[#5D8E67] font-bold' : 'text-[#5D8E67]/25'}`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 top-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(93,142,103,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(93,142,103,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 px-4 pb-6">
          {/* Title box */}
          <div className="mx-2 mb-1 border border-[#5D8E67]/20 rounded">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="title"
              className="w-full bg-transparent px-3 py-2 font-mono text-[#2d4a35]/80 text-sm placeholder:text-[#5D8E67]/25 focus:outline-none"
            />
          </div>
          {/* Body box */}
          <div className="mx-2 border border-[#5D8E67]/20 rounded">
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              onBlur={handleBlur}
              rows={20}
              placeholder="Start writing..."
              className="w-full bg-transparent px-3 py-3 font-handwriting text-[#2d4a35] text-lg leading-relaxed placeholder:text-[#5D8E67]/25 focus:outline-none resize-none"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', lineHeight: '1.9' }}
            />
          </div>
          {/* Char count */}
          <div className="flex justify-end mt-1 mr-2">
            <span className="font-mono text-[#5D8E67]/20 text-[10px]">{localBody.length}</span>
          </div>
        </div>
      </div>

      {/* Delete confirm overlay */}
      {showDelete && (
        <div className="absolute inset-0 bg-[#F9F5ED]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#F9F5ED] border-2 border-[#FFD1BD] rounded-2xl p-6 max-w-xs mx-4 shadow-card text-center">
            <p className="font-comfortaa font-bold text-[#5D8E67] mb-2">Delete this entry?</p>
            <p className="font-comfortaa text-[#5D8E67]/60 text-sm mb-5">This can't be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDelete(false)} className="font-comfortaa text-sm px-4 py-2 border-2 border-[#9FD89C]/50 rounded-xl text-[#5D8E67] hover:bg-[#9FD89C]/10 transition-colors">Cancel</button>
              <button
                onClick={() => { onDelete(); setShowDelete(false); }}
                className="font-comfortaa font-bold text-sm px-4 py-2 bg-[#FFD1BD] border-2 border-[#FFD1BD] rounded-xl text-[#3a5c42] hover:bg-[#FFD1BD]/60 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MyNotebookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newType, setNewType] = useState<EntryType>('letter');
  const [loading, setLoading] = useState(false);
  const [opError, setOpError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user?.id]);

  async function loadEntries() {
    setLoading(true);
    setOpError('');
    const { data, error } = await supabase
      .from('journals')
      .select('journal_id, type, title, content, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load journals:', error);
      setOpError('Couldn\'t load your entries. Please refresh the page.');
    } else if (data) {
      const mapped: Entry[] = data.map((row) => ({
        id: row.journal_id as string,
        type: (row.type as EntryType) ?? 'note',
        title: (row.title as string) ?? '',
        body: (row.content as string) ?? '',
        date: toDisplayDate(row.created_at as string),
        dayOfWeek: toDayKey(row.created_at as string),
      }));
      setEntries(mapped);
      setActiveId(mapped[0]?.id ?? '');
    }
    setLoading(false);
  }

  const activeEntry = entries.find((e) => e.id === activeId) ?? entries[0];

  const createEntry = async (type: EntryType) => {
    setOpError('');
    const { data, error } = await supabase
      .from('journals')
      .insert({ user_id: user!.id, type, title: 'Untitled', content: '' })
      .select('journal_id, type, title, content, created_at')
      .single();

    if (error) {
      console.error('Failed to create entry:', error);
      setOpError('Couldn\'t create entry. Please try again.');
      return;
    }

    const entry: Entry = {
      id: data.journal_id as string,
      type: (data.type as EntryType) ?? type,
      title: (data.title as string) ?? '',
      body: (data.content as string) ?? '',
      date: toDisplayDate(data.created_at as string),
      dayOfWeek: toDayKey(data.created_at as string),
    };
    setEntries((prev) => [entry, ...prev]);
    setActiveId(entry.id);
  };

  const updateEntry = async (updated: Entry) => {
    const original = entries.find((e) => e.id === updated.id);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    const { error } = await supabase
      .from('journals')
      .update({ title: updated.title, content: updated.body, updated_at: new Date().toISOString() })
      .eq('journal_id', updated.id);
    if (error) {
      console.error('Failed to update entry:', error);
      if (original) setEntries((prev) => prev.map((e) => (e.id === updated.id ? original : e)));
      setOpError('Couldn\'t save changes. Please try again.');
    }
  };

  const deleteEntry = async () => {
    setOpError('');
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('journal_id', activeId);
    if (error) {
      console.error('Failed to delete entry:', error);
      setOpError('Couldn\'t delete entry. Please try again.');
      return;
    }
    const remaining = entries.filter((e) => e.id !== activeId);
    setEntries(remaining);
    setActiveId(remaining[0]?.id ?? '');
  };

  const displayName = (user?.user_metadata?.name as string) ?? user?.email?.split('@')[0] ?? 'You';

  // Gate: not logged in
  if (!user) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <DfmIconSlot variant="notebook" size="lg" className="mx-auto mb-6" />
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-3">Your Notebook</h1>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl mb-8 leading-relaxed">
            All your letters, notes, and accomplishments live here. Sign in to see them.
          </p>
          <button
            onClick={() => navigate('/sign-in')}
            className="inline-flex items-center gap-2 font-comfortaa font-bold text-base bg-[#5D8E67] text-[#F9F5ED] px-8 py-3 rounded-2xl hover:bg-[#4a7255] transition-colors shadow-md"
          >
            <LogIn size={18} /> Sign in to continue
          </button>
        </div>
      </PageWrapper>
    );
  }

  // Folder groups
  const groups: { label: string; type: EntryType; icon: React.ReactNode; color: string }[] = [
    { label: 'Letters', type: 'letter', icon: <DfmIconSlot variant="logo" size="xs" />, color: 'text-[#b89a2a]' },
    { label: 'Accomplishments', type: 'accomplishment', icon: <Award size={14} />, color: 'text-[#c07a5a]' },
    { label: 'Notes', type: 'note', icon: <FileText size={14} />, color: 'text-[#5D8E67]' },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f2ede3]">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-[#c8b89a]/40 bg-[#f5f1e8] transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
      >
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#c8b89a]/30">
          <div className="flex items-center justify-between mb-1">
            <span className="font-comfortaa font-bold text-[#5D8E67] text-sm">my notebook</span>
            <DfmIconSlot variant="notebook" size="xs" />
          </div>
          <p className="font-comfortaa text-[10px] text-[#5D8E67]/40">
            {loading ? 'loading…' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          </p>
        </div>

        {/* New entry button */}
        <div className="px-3 py-2 border-b border-[#c8b89a]/30">
          <div className="flex gap-1.5 mb-2">
            {(['letter', 'note', 'accomplishment'] as EntryType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`flex-1 font-comfortaa text-[9px] font-semibold py-1 rounded-lg border transition-colors ${
                  newType === t
                    ? 'bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]'
                    : 'border-[#9FD89C]/40 text-[#5D8E67]/60 hover:border-[#5D8E67]/40'
                }`}
              >
                {t === 'accomplishment' ? 'win' : t}
              </button>
            ))}
          </div>
          <button
            onClick={() => createEntry(newType)}
            className="w-full flex items-center justify-center gap-1.5 font-comfortaa font-semibold text-xs text-[#5D8E67]/70 border-2 border-dashed border-[#9FD89C]/50 rounded-xl py-1.5 hover:border-[#5D8E67] hover:text-[#5D8E67] transition-colors"
          >
            <Plus size={12} /> New entry
          </button>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <p className="font-comfortaa text-[11px] text-[#5D8E67]/30 px-4 py-3">Loading entries…</p>
          ) : (
            groups.map(({ label, type, icon, color }) => {
              const group = entries.filter((e) => e.type === type);
              if (group.length === 0) return null;
              return (
                <div key={type} className="mb-1">
                  <div className={`flex items-center gap-1.5 px-4 py-1.5 font-comfortaa font-bold text-[11px] uppercase tracking-wider ${color}`}>
                    {icon} {label}
                  </div>
                  {group.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setActiveId(entry.id)}
                      className={`w-full text-left flex items-center gap-2 px-5 py-2 transition-colors rounded-lg mx-1 ${
                        activeId === entry.id
                          ? 'bg-[#e8e0d0] text-[#5D8E67]'
                          : 'text-[#5D8E67]/65 hover:bg-[#ece8e0]'
                      }`}
                    >
                      <span className="font-comfortaa text-xs truncate flex-1">{entry.title}</span>
                      {activeId === entry.id && <ChevronRight size={10} className="flex-shrink-0 text-[#5D8E67]/40" />}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* User tag */}
        <div className="px-4 py-3 border-t border-[#c8b89a]/30">
          <p className="font-comfortaa text-[10px] text-[#5D8E67]/40 truncate">signed in as {displayName}</p>
        </div>
      </aside>

      {/* ── Editor ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute top-3 left-3 z-20 w-7 h-7 rounded-lg bg-[#f5f1e8] border border-[#c8b89a]/40 flex items-center justify-center text-[#5D8E67]/50 hover:text-[#5D8E67] transition-colors"
        >
          <ChevronRight size={14} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Operation error banner */}
        {opError && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#FFD1BD]/50 border-b border-[#FFD1BD] flex-shrink-0 z-10">
            <span className="font-comfortaa text-[#5D8E67] text-xs">{opError}</span>
            <button onClick={() => setOpError('')} className="ml-3 text-[#5D8E67]/60 hover:text-[#5D8E67] transition-colors">
              <X size={13} />
            </button>
          </div>
        )}

        {activeEntry ? (
          <NotebookEditor
            key={activeEntry.id}
            entry={activeEntry}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ background: '#faf8f2' }}>
            <DfmIconSlot variant="pencil" size="lg" className="mb-4" />
            <p className="font-comfortaa text-[#5D8E67]/50 text-sm mb-4">
              {loading ? 'Loading your entries…' : opError ? 'Failed to load entries.' : 'No entries yet.'}
            </p>
            {!loading && !opError && (
              <button
                onClick={() => createEntry('letter')}
                className="font-comfortaa font-semibold text-sm bg-[#5D8E67] text-[#F9F5ED] px-5 py-2 rounded-xl hover:bg-[#4a7255] transition-colors"
              >
                Write your first letter
              </button>
            )}
            {!loading && opError && (
              <button
                onClick={loadEntries}
                className="font-comfortaa font-semibold text-sm border border-[#5D8E67]/40 text-[#5D8E67] px-5 py-2 rounded-xl hover:bg-[#9FD89C]/10 transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
