# Blitz FlareSolver

<p align="center">
  <strong>Node.js Cloudflare challenge solver</strong><br>
  FlareSolverr-compatible API · Built by Blitz
</p>

<p align="center">
  <a href="https://github.com/blitzlabx"><img src="https://img.shields.io/badge/Author-Blitz-blue?style=for-the-badge" alt="Author"></a>
  <a href="https://x.com/blitzlabx"><img src="https://img.shields.io/badge/X-@blitzlabx-black?style=for-the-badge&logo=x" alt="X"></a>
  <a href="https://github.com/blitzlabx/blitz-flaresolver"><img src="https://img.shields.io/badge/GitHub-blitz--flaresolver-181717?style=for-the-badge&logo=github" alt="GitHub"></a>
  <a href="https://blitz.devs.surf"><img src="https://img.shields.io/badge/Site-blitz.devs.surf-purple?style=for-the-badge" alt="Site"></a>
</p>

---

## Credits & Ownership

**This project is created, owned, and maintained by Blitz.**

- **Author**: Blitz  
- **Handle / X**: [@blitzlabx](https://x.com/blitzlabx)  
- **GitHub**: [github.com/blitzlabx](https://github.com/blitzlabx)  
- **Website**: [blitz.devs.surf](https://blitz.devs.surf)

All credits belong to **Blitz (@blitzlabx)**.

---

## What is this?

A lightweight **Node.js** service that opens a stealth Chromium browser, loads a URL, waits out Cloudflare challenges, and returns the final HTML.

Speaks the same **`POST /v1`** protocol as FlareSolverr — point `TI_FLARESOLVERR_URL` at this service and [tokyoinsider-api](https://github.com/blitzlabx/tokyoinsider-api) works without code changes.

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Service info + Blitz credits |
| `GET` | `/health` | Health + job queue stats |
| `POST` | `/v1` | Solve / fetch a URL |

### `POST /v1`

```json
{
  "cmd": "request.get",
  "url": "https://www.tokyoinsider.net/anime/B/Bleach_(TV)",
  "maxTimeout": 60000
}
```

---

## Quick start

```bash
git clone https://github.com/blitzlabx/blitz-flaresolver.git
cd blitz-flaresolver
npm install
npm start
```

Default port: **8191**

### Docker

```bash
docker build -t blitz-flaresolver .
docker run -p 8191:8191 blitz-flaresolver
```

### Wire to tokyoinsider-api

```bash
export TI_FLARESOLVERR_URL=http://localhost:8191
```

---

## Deploy

| Platform | Notes |
|----------|--------|
| **Docker / VPS** | Recommended — needs Chromium |
| **Render** | `render.yaml` (Docker) |
| **Railway / Fly** | Use Dockerfile |

Needs a real browser. Pure Node hosts without Chromium will not work.

---

## Env vars

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8191` | Listen port |
| `HEADLESS` | `true` | Headless Chromium |
| `MAX_CONCURRENT` | `2` | Parallel pages |
| `DEFAULT_TIMEOUT` | `60000` | Max wait (ms) |
| `PUPPETEER_EXECUTABLE_PATH` | auto | Chromium binary |

---

## License

MIT — Copyright (c) 2026 **Blitz (@blitzlabx)**

---

<p align="center">
  <sub>Made by Blitz · All credits to Blitz (@blitzlabx)</sub>
</p>
