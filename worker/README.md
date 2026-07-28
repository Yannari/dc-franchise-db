# Casting Studio backend (Cloudflare Worker)

Lets the **live** site (`yannari.github.io`) save characters permanently by committing
`franchise_roster.json`, `voice-profiles.json`, and avatar PNGs to the GitHub repo.
GitHub Pages then redeploys. Locally, `serve.py` still handles this — the Worker is
only for the deployed site.

## One-time setup

### 1. Create a GitHub token (fine-grained PAT)
- GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new.
- Repository access: **Only select repositories** → `Yannari/dc-franchise-db`.
- Permissions: **Contents → Read and write**. Nothing else.
- Copy the token (starts with `github_pat_…`).

### 2. Pick a write password (STUDIO_TOKEN)
Any long random string, e.g. run once and copy the output:
```
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 3. Deploy the Worker
From this `worker/` folder:
```
npm install -g wrangler        # if you don't have it
wrangler login                 # opens a browser once
wrangler secret put GITHUB_TOKEN   # paste the PAT from step 1
wrangler secret put STUDIO_TOKEN   # paste the password from step 2
wrangler deploy
```
`wrangler deploy` prints your Worker URL, e.g. `https://dc-studio.<you>.workers.dev`.

Check it: open `https://dc-studio.<you>.workers.dev/api/ping` → should show
`{"ok":true,"roster":N}`.

### 4. Point the frontend at the Worker
Two ways — pick one:

- **Permanent:** edit `js/studio.js`, set
  `const STUDIO_API_PROD = 'https://dc-studio.<you>.workers.dev';`
  then commit + push.
- **Quick test (no code change):** on the live site, open the browser console and run:
  ```
  localStorage.setItem('studio_api_base', 'https://dc-studio.<you>.workers.dev');
  ```

### 5. Set the write password in your browser
On the live site, once, in the console:
```
localStorage.setItem('studio_api_token', 'PASTE_STUDIO_TOKEN_FROM_STEP_2');
```
This stays in your browser and is sent as `Authorization: Bearer …` on every save.
Anyone without it gets `401` and cannot write.

## Done
On the live site, the Casting Studio header should now read **● writes to repo**.
Save a character → the Worker commits to the repo → Pages redeploys (~30–60s) → the
change is live and permanent. Each save makes 1–3 commits (roster, voice, avatar).

## Notes
- `wrangler.toml` holds the non-secret config (repo, branch, allowed origin). Edit it
  if any of those change.
- Tokens live only as Worker secrets and in your browser's localStorage — never in the
  repo.
- `serve.py` is unchanged and still works for local development at `localhost:8080`.
