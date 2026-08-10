# Dear Future Me API integrations

Dear Future Me exposes one private, user-scoped REST API for the web notebook,
voice clients, and external AI tools. Personal API keys begin with `dfm_live_`,
are stored only as SHA-256 hashes, and are shown once when created.

Production API: `https://dear-future-me-phi.vercel.app`

Live contract: `https://dear-future-me-phi.vercel.app/v1/openapi.json`

## Get access

1. Sign in to the deployed Dear Future Me web app.
2. Open `/developer` and create a read/write API key.
3. Copy the key immediately and keep it private.
4. View the live contract at the URL above.

## Integration paths

- **ChatGPT custom GPT Action:** import the OpenAPI URL and configure a custom
  `x-api-key` header. See [chatgpt/README.md](chatgpt/README.md).
- **Gemini function calling:** use the eight declarations and dispatch demo in
  [gemini/](gemini/). Gemini does not import OpenAPI directly.
- **Any voice agent or app:** call the REST endpoints directly with
  `x-api-key: dfm_live_…`. Audio uploads use a signed Supabase URL so media
  bytes never cross the Vercel function.

## Safety and privacy

Every service-layer journal query is scoped by the API key's `user_id`.
Permanent deletion requires both `confirm=true` and a key with `delete` scope.
Crisis resources are static data served outside an LLM prompt. The hackathon
build does not expose tools for sharing memories, contacting people, or taking
medical/emergency actions.

Run production auth, isolation, and OpenAPI gates with:

```bash
DFM_API_URL=https://dear-future-me-phi.vercel.app \
DFM_API_KEY_A=dfm_live_USER_A \
DFM_API_KEY_B=dfm_live_USER_B \
./integrations/tests.sh
```

## What judges can verify quickly

- Open the live OpenAPI contract without a login.
- Call `/v1/crisis-resources?region=us` without a key and receive static safety
  data that never enters an LLM prompt.
- Save through ChatGPT, Gemini, or a voice client and reveal the same row in the
  DFM web notebook because every integration shares the production journal.
- Try a second user's journal ID and receive 404: the service-role database
  client is always constrained by the personal key's `user_id`.
- Create a future letter, let the authenticated cron deliver it through Resend,
  and observe that a retry is a no-op.
