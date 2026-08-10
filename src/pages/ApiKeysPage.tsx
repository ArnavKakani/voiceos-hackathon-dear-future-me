import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Key, LogIn, Plus, RefreshCw, ShieldOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import supabase from '../supabase/client';

// ── API base ──────────────────────────────────────────────────────────────────
// Production: leave VITE_DFM_API_URL unset. The empty string means same-origin,
// so requests go to `/v1/keys` on whatever domain the site is served from.
// Local dev against the FastAPI service: put VITE_DFM_API_URL=http://localhost:8000
// in your `.env.local` (the API runs separately from the Vite dev server).
const API_BASE = (import.meta.env.VITE_DFM_API_URL as string | undefined) ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────
// Note: `key_hash` exists server-side and is never sent to or rendered by the client.
interface ApiKey {
  id: string;
  name: string;
  key_hint: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  scopes?: string[];
}

interface CreatedKey extends ApiKey {
  key: string;
}

type ErrorKind = 'unreachable' | 'unauthorized' | 'failed';

interface ApiError {
  kind: ErrorKind;
  message: string;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const UNREACHABLE: ApiError = {
  kind: 'unreachable',
  message:
    "We couldn't reach the Dear Future Me API. It isn't deployed yet — this page ships a little ahead of it. Nothing is broken on your end.",
};

const UNAUTHORIZED: ApiError = {
  kind: 'unauthorized',
  message: 'Your session expired. Please sign in again to manage your keys.',
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { ok: false, error: UNAUTHORIZED };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // Network failure / CORS / DNS — the service isn't there.
    return { ok: false, error: UNREACHABLE };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, error: UNAUTHORIZED };
  }
  if (response.status === 404) {
    // The route doesn't exist on this origin yet.
    return { ok: false, error: UNREACHABLE };
  }

  // The SPA's index.html comes back with a 200 when the API isn't mounted on
  // this origin — same situation as a 404, not a real response.
  if (response.ok && (response.headers.get('content-type') ?? '').includes('text/html')) {
    return { ok: false, error: UNREACHABLE };
  }

  const raw = await response.text().catch(() => '');
  let body: unknown = null;
  if (raw) {
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      if (response.ok) return { ok: false, error: UNREACHABLE };
    }
  }

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed (${response.status}).`;
    return { ok: false, error: { kind: 'failed', message: detail } };
  }

  return { ok: true, data: body as T };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDisplayDate(iso: string | null): string {
  if (!iso) return 'never';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CONNECT_STEPS = [
  {
    title: 'Make a key here',
    body: 'Name it something you’ll recognise later, like "ChatGPT" or "my iPhone".',
  },
  {
    title: 'Point ChatGPT at the API',
    body: 'Create a GPT → Actions → Import from URL, then paste the Dear Future Me OpenAPI link.',
  },
  {
    title: 'Paste the key as its password',
    body: 'Auth → API Key → Custom header named x-api-key. Then ask it to save a proud moment.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export function ApiKeysPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | null>(null);
  const [freshKey, setFreshKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await apiFetch<ApiKey[] | { keys: ApiKey[] }>('/v1/keys');
    if (!result.ok) {
      setLoadError(result.error);
      setKeys([]);
    } else {
      const list = Array.isArray(result.data) ? result.data : (result.data?.keys ?? []);
      setKeys(list);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadKeys();
  }, [user, loadKeys]);

  const createKey = async () => {
    const name = newName.trim() || 'default';
    setCreating(true);
    setCreateError(null);
    setCopied(false);
    const result = await apiFetch<CreatedKey>('/v1/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setCreating(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setFreshKey(result.data);
    setNewName('');
    void loadKeys();
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    const result = await apiFetch<unknown>(`/v1/keys/${id}/revoke`, { method: 'POST' });
    setRevokingId(null);
    setConfirmingId(null);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)),
    );
  };

  const copyFreshKey = async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  // ── Soft gate: signed out ───────────────────────────────────────────────────
  if (!user) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <DfmIconSlot variant="glue" size="lg" className="mx-auto mb-6" />
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-3">Developer Keys</h1>
          <p className="font-handwriting text-[#5D8E67]/70 text-xl mb-8 leading-relaxed">
            Keys let ChatGPT, Gemini, and the Dear Future Me iPhone app write into your notebook.
            Sign in to make one.
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

  // ── Signed in ───────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <DfmIconSlot variant="glue" size="lg" />
            <span className="font-handwriting text-[#5D8E67]/50 text-lg -rotate-3 mt-3 hidden sm:block">
              for the robots ✳
            </span>
          </div>
          <span className="inline-block font-handwriting text-[#5D8E67]/70 text-lg mb-4 bg-[#B7E3FF]/30 px-4 py-1 rounded-full border border-[#B7E3FF]/60">
            one key, three assistants
          </span>
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl mb-4 leading-tight">
            Let your AI tools write<br />into your notebook.
          </h1>
          <p className="font-handwriting text-[#5D8E67]/65 text-lg max-w-lg leading-relaxed">
            An API key is how ChatGPT, Gemini, or the Dear Future Me iPhone app prove they're speaking for you.
          </p>
        </div>

        {/* What is this? */}
        <section className="rounded-2xl border-2 border-[#9FD89C] bg-[#9FD89C]/15 p-6 sm:p-8 mb-8">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-3 flex items-center gap-2">
            <Sparkles size={17} /> What is this?
          </h2>
          <ul className="space-y-2.5 font-comfortaa text-[#5D8E67]/80 text-sm leading-relaxed">
            <li>
              Your key lets AI tools — ChatGPT, Gemini, the Dear Future Me iPhone app — read and write
              <em> your</em> letters and reflections. Nobody else's.
            </li>
            <li>
              Treat it like a password. Anyone holding it can see what you've written here, so don't paste
              it into a shared doc or a screenshot.
            </li>
            <li>
              Revoke it any time. The key stops working immediately, and your letters stay exactly where
              they are.
            </li>
          </ul>
        </section>

        {/* Connect ChatGPT teaser */}
        <section className="mb-12">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-4">
            Connect ChatGPT in three steps
          </h2>
          <ol className="space-y-3">
            {CONNECT_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border-2 border-[#FEE188] bg-[#FEE188]/25 p-4"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F9F5ED] border-2 border-[#FEE188] flex items-center justify-center font-comfortaa font-bold text-[#5D8E67] text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-comfortaa font-semibold text-[#5D8E67] text-sm mb-0.5">{step.title}</p>
                  <p className="font-comfortaa text-[#5D8E67]/70 text-sm leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* The raw key, shown exactly once */}
        {freshKey && (
          <section className="rounded-2xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/25 p-6 sm:p-8 mb-8">
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1 flex items-center gap-2">
              <Key size={17} /> Here's your key — “{freshKey.name}”
            </h2>
            <p className="font-handwriting text-[#5D8E67]/75 text-xl mb-4 leading-snug">
              You won't see this again — store it now.
            </p>
            <div className="bg-[#F9F5ED] border-2 border-[#5D8E67]/30 rounded-2xl p-4 mb-4">
              <code className="block font-mono text-[#3a5c42] text-sm break-all leading-relaxed">
                {freshKey.key}
              </code>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm" onClick={copyFreshKey}>
                {copied ? (
                  <>
                    <Check size={15} className="inline mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={15} className="inline mr-2" /> Copy key
                  </>
                )}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setFreshKey(null); setCopied(false); }}>
                I've stored it
              </Button>
              <span className="font-handwriting text-[#5D8E67]/55 text-base">
                after this, only the hint stays
              </span>
            </div>
          </section>
        )}

        {/* Create a key */}
        <section className="rounded-2xl border-2 border-[#5D8E67]/25 bg-[#F9F5ED] p-6 sm:p-8 mb-8 shadow-soft">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1">Create a key</h2>
          <p className="font-comfortaa text-[#5D8E67]/60 text-sm mb-4">
            Give it a name so you know which tool to cut off later.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !creating) void createKey(); }}
              placeholder="ChatGPT, my iPhone, Gemini demo…"
              maxLength={60}
              className="flex-1 bg-[#F9F5ED] border-2 border-[#9FD89C]/60 rounded-2xl px-5 py-3 font-comfortaa text-[#5D8E67] text-sm placeholder:text-[#5D8E67]/30 focus:outline-none focus:border-[#5D8E67] transition-colors"
            />
            <Button variant="primary" disabled={creating} onClick={createKey}>
              <Plus size={16} className="inline mr-2" />
              {creating ? 'Creating…' : 'Create key'}
            </Button>
          </div>
          {createError && (
            <p className="font-comfortaa text-[#5D8E67]/80 text-sm mt-4 bg-[#FFD1BD]/40 border border-[#FFD1BD] rounded-xl px-4 py-3">
              {createError.message}
            </p>
          )}
        </section>

        {/* Key list */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-lg">Your keys</h2>
            <button
              onClick={() => void loadKeys()}
              className="inline-flex items-center gap-1.5 font-comfortaa text-[#5D8E67]/60 hover:text-[#5D8E67] text-xs transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <p className="font-comfortaa text-[#5D8E67]/50 text-sm py-8 text-center">Loading your keys…</p>
          ) : loadError ? (
            <div className="rounded-2xl border-2 border-[#B7E3FF] bg-[#B7E3FF]/20 p-6">
              <p className="font-comfortaa font-semibold text-[#5D8E67] text-sm mb-2">
                {loadError.kind === 'unauthorized' ? 'Session expired' : 'The API is still on its way'}
              </p>
              <p className="font-comfortaa text-[#5D8E67]/75 text-sm leading-relaxed mb-4">
                {loadError.message}
              </p>
              {loadError.kind === 'unauthorized' ? (
                <Button variant="secondary" size="sm" onClick={() => navigate('/sign-in')}>
                  Sign in again
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => void loadKeys()}>
                  Try again
                </Button>
              )}
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#9FD89C]/70 bg-[#9FD89C]/10 p-8 text-center">
              <DfmIconSlot variant="scissors" size="md" className="mx-auto mb-3" />
              <p className="font-comfortaa text-[#5D8E67]/70 text-sm">
                No keys yet — create one to connect ChatGPT, Gemini, or the iPhone app.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {keys.map((k) => {
                const revoked = Boolean(k.revoked_at);
                return (
                  <li
                    key={k.id}
                    className={`rounded-2xl border-2 p-5 transition-colors ${
                      revoked
                        ? 'border-[#5D8E67]/15 bg-[#5D8E67]/5'
                        : 'border-[#9FD89C] bg-[#9FD89C]/15'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`font-comfortaa font-bold text-sm ${
                              revoked ? 'text-[#5D8E67]/45' : 'text-[#5D8E67]'
                            }`}
                          >
                            {k.name}
                          </span>
                          {revoked && (
                            <span className="font-comfortaa text-[10px] uppercase tracking-wider text-[#5D8E67]/50 border border-[#5D8E67]/25 rounded-full px-2 py-0.5">
                              revoked
                            </span>
                          )}
                        </div>
                        <code className="block font-mono text-[#3a5c42]/70 text-xs mb-2 break-all">
                          {k.key_hint}…
                        </code>
                        <p className="font-comfortaa text-[#5D8E67]/55 text-xs">
                          created {toDisplayDate(k.created_at)} · last used {toDisplayDate(k.last_used_at)}
                          {revoked && ` · revoked ${toDisplayDate(k.revoked_at)}`}
                        </p>
                      </div>

                      {!revoked && (
                        <div className="flex-shrink-0">
                          {confirmingId === k.id ? (
                            <div className="flex items-center gap-2">
                              <span className="font-handwriting text-[#5D8E67]/70 text-base">sure?</span>
                              <button
                                onClick={() => void revokeKey(k.id)}
                                disabled={revokingId === k.id}
                                className="font-comfortaa font-semibold text-xs px-3 py-1.5 rounded-xl border-2 border-[#FFD1BD] bg-[#FFD1BD]/60 text-[#3a5c42] hover:bg-[#FFD1BD] transition-colors disabled:opacity-50"
                              >
                                {revokingId === k.id ? 'Revoking…' : 'Yes, revoke'}
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="font-comfortaa font-semibold text-xs px-3 py-1.5 rounded-xl border-2 border-[#9FD89C]/60 text-[#5D8E67] hover:bg-[#9FD89C]/20 transition-colors"
                              >
                                Keep it
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingId(k.id)}
                              className="inline-flex items-center gap-1.5 font-comfortaa font-semibold text-xs px-3 py-1.5 rounded-xl border-2 border-[#5D8E67]/25 text-[#5D8E67]/75 hover:border-[#5D8E67] hover:text-[#5D8E67] transition-colors"
                            >
                              <ShieldOff size={13} /> Revoke
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="font-handwriting text-[#5D8E67]/45 text-lg mt-10 rotate-1">
          keys are yours alone — we only ever store a fingerprint of them ✳
        </p>
      </div>
    </PageWrapper>
  );
}
