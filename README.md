# OpenPilates

**Free, self-hosted class planning for mat and reformer Pilates instructors.**

OpenPilates lets you build a class from a library of movements and shows you what the class actually does: which muscles it works, how the spine moves, how much time goes on spring and position changes, and whether it builds to a peak and winds down. It also checks every movement against the clients booked in. It runs on your own server with Docker. There's no subscription, and client details stay with you.

> Version 0.1 — early release. The starter movement library is a draft and needs review by a qualified Pilates instructor before you teach from it (see [Movement library](#movement-library)).

---

## For teachers

OpenPilates is a free class planner for mat and reformer instructors.

- **Build flows from segments.** Search the library by muscle, body position, spine movement, equipment or spring load, then drag movements into segments such as warm-up, build, peak and cool-down. You can add a song and BPM to each segment.
- **See what your class does as you build it.**
  - muscles worked, front and back
  - flexion, extension, rotation and side bend against a target
  - body-position and spring changes, and time spent setting up
  - an effort curve that should build to a peak and then wind down
- **Get checks before you teach.** The app flags a missing cool-down or no back extension. It also flags movements that don't suit someone booked in, such as a pregnancy or a knee replacement, and suggests a swap.
- **Short on time?** Pick a goal, length and level, and OpenPilates drafts a class for you to edit.
- **Teach from Play mode** on your phone or tablet. It shows the current movement, springs, a countdown and what's next.
- **Springs in your studio's colours.** Movements store a load (light, medium, heavy) and show it in your machine's colours: Balanced Body, Merrithew/Stott, Peak, BASI, Align-Pilates, Flexia or classical.

## For studio owners

OpenPilates is a free, open-source class planner you run yourself. There's no subscription, and no cloud company holds your clients' details.

- **Set it up once.** Add your rooms, reformer brand and springs, your props, and what a balanced class means to you. Every instructor's plans then fit your equipment and match your machines.
- **One login per instructor.** Each instructor has their own login, flows and private notes. Everyone shares the studio's movement library and client notes, so a new instructor sees the same cautions and swaps as your senior team.
- **Client details stay put.** Client health notes stay on your server and are never included when flows are shared or exported.
- **Your data is yours.** Back everything up and take it with you. It runs on a NAS, an old laptop or anything that runs Docker.

---

## Install

You need Docker. The image runs on `amd64` and `arm64`, including a Raspberry Pi 4/5, Synology, TrueNAS and Unraid.

### docker run

```bash
docker run -d --name openpilates --restart unless-stopped -p 8080:8080 -v openpilates-data:/data ghcr.io/d-plenty/openpilates:latest
```

Then open `http://<your-server>:8080`. The first visit asks you to name the studio and create the admin account.

### Docker Compose / Dockge

```yaml
services:
  openpilates:
    image: ghcr.io/d-plenty/openpilates:latest
    container_name: openpilates
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      TZ: Australia/Brisbane
```

### Settings

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `8080` | Port inside the container |
| `DATA_DIR` | `/data` | Where the database lives |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `STUDIO_NAME` | — | Create the first admin automatically instead of using the setup page (password 10+ characters) |
| `TRUST_PROXY` | `true` | Read `X-Forwarded-*` headers from a reverse proxy or tunnel |
| `SECURE_COOKIES` | `auto` | `auto` marks cookies Secure when the proxy says HTTPS; `true` forces it |

### HTTPS and remote access

Put OpenPilates behind your usual reverse proxy (Caddy, Nginx Proxy Manager, Traefik) or a Cloudflare Tunnel. It works over Tailscale as well. Sign-in cookies switch to Secure automatically when the proxy reports HTTPS.

### Backups and updates

- Everything lives in one SQLite database in `/data`. To make a full backup, copy that folder.
- Admins can also download a JSON backup from **Team → Backup**. It contains settings, flows, clients, custom movements and notes, but no passwords.
- To update, pull the new image and recreate the container. Database changes are applied automatically. Library movements are refreshed from the image, and any studio edits you've made are kept.

---

## Movement library

The library is one JSON file per movement in [`library/movements/`](library/movements). Each file covers the starting position, spine movement, muscles, spring load, purpose, layers, and cautions with suggested swaps.

**All 58 starter movements are drafts.** We wrote them for OpenPilates in our own words, and they still need checking by a qualified instructor. Each file has a `review` field. When an instructor has checked a movement, set `status` to `reviewed` with their name and the date.

You can contribute in two ways:
- Fix or add a movement file and open a pull request. Run `npm run check:library` first to check the file.
- In the app, an admin can edit any movement for their studio. Use **Download movement file** to share your version.

Please write descriptions and cues yourself. Don't copy them from books, courses or other apps.

## How the analysis works

- **Spine movement** is the share of class time spent in flexion, extension, rotation and side bending. It's compared with a target you can edit per class type. The default is 50 / 25 / 12 / 13%. These measures come from [Kaleen Canevari's writing on class design](https://kaleenc.substack.com/p/what-makes-a-great-pilates-class-part-1).
- **Setting-up time** is estimated at 15 s per spring change, 20 s per position change and 45 s to put on or take off a box or jump board.
- **Spring colours** come from the manufacturers' published charts. Conversions between brands are approximate, so you can rename and recolour springs per room in **Studio**.
- **Client checks** match a client's caution tags (such as pregnancy, knee or low bone density) against the cautions on each movement. The app suggests swaps but doesn't decide; the instructor always does.

OpenPilates is a planning tool for qualified instructors. It is not medical advice.

## Develop

Requires Node.js 22.13 or newer. The project has no npm dependencies.

```bash
npm run dev     # http://localhost:8080, data in ./data
npm test        # analysis, drafting and API tests
npm run check:library
```

The project layout:
- `server/`: HTTP API (Node `http` and the built-in `node:sqlite`)
- `shared/`: vocabulary, analysis and the drafting logic, used by both the server and the browser
- `public/`: the web app, plain ES modules with no build step
- `library/`: the movement library

## Roadmap

- Phone app (Android first), local-first, which can sync with this server later
- More movements, and more reviewed ones
- Cadillac/tower, chair and barrel
- Printable class cards and PDF export
- Sign-in with OIDC (for example Pocket ID or Authentik)

## Credits and licence

Made by **Sarah Blake** (Pilates teacher) and **Declan Plenty** (developer, Plenty Technologies).

- Code: [GPL-3.0-or-later](LICENSE)
- Movement library: [CC BY-SA 4.0](LICENSE-DATA.md)
