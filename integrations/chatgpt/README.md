# Connect Dear Future Me to a custom GPT

Prerequisites: a deployed DFM API, a signed-in DFM account, and a personal API
key created on the DFM `/developer` page. The key is shown once; store it in a
password manager and never put it in source control.

## GPT editor click path

1. In ChatGPT, open **Explore GPTs → Create**.
2. Open the **Configure** panel and name the GPT `Dear Future Me`.
3. Use this instruction: `Help me capture and revisit my own memories. Use the Dear Future Me action whenever I ask to save, search, list, or read an entry. Never claim a write succeeded until the action returns successfully. Keep spoken-style answers to two short sentences.`
4. Under **Actions**, choose **Create new action**.
5. Choose **Import from URL** and enter `https://dear-future-me-phi.vercel.app/v1/openapi.json`.
6. Open **Authentication → API Key**. Choose **Custom**, set the header name to
   `x-api-key`, and paste the personal `dfm_live_…` key from `/developer`.
7. Leave the GPT private or link-only for the hackathon. A public GPT requires
   additional privacy-policy work.
8. Save, open Preview, and run the prompts below in order.

If the editor rejects the full schema, download `/v1/openapi.json`, retain only
the paths used by the prompts below plus their referenced component schemas,
and paste that smaller OpenAPI document into the action editor.

```bash
curl -fsS https://dear-future-me-phi.vercel.app/v1/openapi.json | jq '
  .paths |= with_entries(select(.key | IN(
    "/v1/entries", "/v1/entries/{entry_id}",
    "/v1/letters", "/v1/letters/{entry_id}",
    "/v1/search", "/v1/timeline", "/v1/themes", "/v1/me"
  )))
' > dfm-gpt-action.json
```

## Six demo prompts

1. `Save a proud moment: I deployed my first API tonight.`
2. `I want future me to remember how this feels. Write a letter for one month from now.`
3. `Save this memory: I felt nervous before the demo, but my teammate helped me focus.`
4. `Have I ever written about feeling nervous before?`
5. `Show my recent memories and read the most relevant one back to me.`
6. `Compare that past moment with the proud moment I saved tonight.`

After prompt 2, open the DFM web notebook. The new future letter should appear
there because the API and web app share the same `journals` table.
