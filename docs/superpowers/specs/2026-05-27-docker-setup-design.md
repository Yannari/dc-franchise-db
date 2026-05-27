# Docker Setup — DC Franchise Simulator

## Goal

Containerize the DC Franchise Simulator as a lightweight Docker image for both local development and future cloud deployment. No code changes to the existing project — purely additive files.

## Approach

**Nginx Alpine** — industry-standard static file server. Single-stage Dockerfile producing a ~25MB image. `docker-compose.yml` for local dev with live file mounting.

## Files to Create

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the production image from `nginx:1.27-alpine` |
| `docker-compose.yml` | Local dev server on `localhost:8080` with volume mount |
| `nginx.conf` | ES module MIME types, gzip, caching, security headers |
| `.dockerignore` | Excludes `node_modules`, `.git`, test artifacts, PDFs |

No existing files are modified.

## Dockerfile

Base image: `nginx:1.27-alpine`

Steps:
1. Copy `nginx.conf` to `/etc/nginx/conf.d/default.conf`
2. Copy static content to `/usr/share/nginx/html/`:
   - Root HTML files: `index.html`, `simulator.html`, `seasons.html`, `voting-analytics.html`, `season_ref.html`, `awards.html`, `season-awards_ref.html`, `devotees.html`, `rankings.html`, `player.html`, `timeline.html`, `compare.html`, `franchise.html`, `current-season.html`
   - `styles.css`
   - `js/` — all modules including `js/chal/`
   - `assets/` — avatars (PNG) and fonts (TTF)
   - `franchise_roster.json`
   - `season*-data.json` (seasons 1-9)
   - `backup/` — `franchise_database.json`, `seasons_database.json`, `rankings_database.json`
   - `tools/` — `ranking-override-manager.html`, `story-format-converter.html`
3. Expose port 80
4. Default Nginx CMD starts the server

Estimated image size: ~25MB (Alpine base ~7MB + Nginx ~5MB + project static files ~13MB).

## nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # ES module MIME type (critical — browsers reject modules served as text/plain)
    types {
        application/javascript js mjs;
        text/html html htm;
        text/css css;
        application/json json;
        image/png png;
        font/ttf ttf;
        image/svg+xml svg;
    }

    # Gzip compression
    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # Cache: long for assets (avatars/fonts), short for code/data
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.(html|js|css|json)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## docker-compose.yml

```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - .:/usr/share/nginx/html:ro
```

- `localhost:8080` maps to container port 80
- Volume mount: edit files on host, refresh browser — no rebuild needed
- `:ro` prevents container from modifying host files

## .dockerignore

Excluded from image:
- `node_modules/` — test-only dependencies, ~500MB
- `.git/` — repo history
- `DATA_SEASON/` — PDFs and spreadsheets (not part of website)
- `.superpowers/`, `docs/`, `.claude/`, `.vs/`, `.worktrees/`
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Test artifacts (`*-test-*.png`), mockup HTML files
- `package.json`, `package-lock.json` — not needed at runtime

## Usage

### Local development
```bash
docker-compose up          # serves at http://localhost:8080
docker-compose up -d       # background mode
docker-compose down        # stop
```

### Production build
```bash
docker build -t dc-franchise-db .
docker run -p 8080:80 dc-franchise-db
```

### Deploy to any cloud
The image is a standard Nginx container — compatible with:
- AWS ECS / Fargate
- Google Cloud Run
- Azure Container Apps
- DigitalOcean App Platform
- Any VPS with Docker installed

Push to a registry (`docker push`) and point the cloud service at it.

## What stays the same

- All existing code unchanged — no imports, paths, or structure modified
- `simulator.html` still opens directly in a browser for non-Docker dev
- Tests still run on host via `npm test` (vitest + jsdom + playwright)
- Git workflow unchanged
