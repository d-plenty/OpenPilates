# OpenPilates

**Free, self-hosted class planning for mat and reformer Pilates instructors.**

OpenPilates lets you build a class from a library of movements and shows you what the class actually does: which muscles it works, how the spine moves, how much time goes on spring and position changes, and whether it builds to a peak and winds down. It also checks every movement against the clients booked in. It runs on your own server with Docker. There's no subscription, and client details stay with you.

> Version 0.6 — early release. The starter movement library is a draft and needs review by a qualified Pilates instructor before you teach from it (see [Movement library](#movement-library)).

---

## For teachers

OpenPilates is a free class planner for mat and reformer instructors.

- **Start from the class you're teaching.** Pick a class type (Reformer Flow, Mat Flow, or one your studio set up), a length and a level. You get its phases, such as warm-up, footwork, standing legs, core and cool-down, each with the minutes it usually takes.
- **Build in blocks.** A block is one movement and what you build on it: the version the class does, the springs (with support and challenge springs for individuals), layers in your own words, a finisher, and what you'll offer anyone who needs less or more. You plan it right where it sits in the flow. Add blocks from a searchable picker, from the library beside the flow, or drop in a whole **series** (Footwork, Short Box, Long Stretch, kneeling arms).
- **Time that adds up.** A block's time is the movement plus time for each layer and the finisher, and spring, position and box changes are counted too. Each phase shows its time against the minutes it was given, so you can see where a class runs long before you teach it.
- **See what your class does as you build it.**
  - muscles worked, front and back
  - flexion, extension, rotation and side bend against a target
  - body-position and spring changes, and time spent setting up
  - an effort curve that should build to a peak and then wind down
  - **a spring map**: which setting each stretch of the class runs on, where every change falls, and whether you're inside the limit set for that class type
  - **class balance**: time on lower body, upper body, core and stretch; how much is holding still against load versus moving; and which movement categories (trunk flexion, extension, side bend, rotation, hip work, hands-and-knees, standing) the class hasn't touched yet
- **A picture for every movement, showing what it does.** Each movement has its own drawn frames: start and finish, a middle frame where the movement has three parts, or "one side, the other" for alternating movements like Running. Faces and feet show whether the body is on its back, front or side. Your studio can add its own photo to any movement.
- **Light and dark.** Switch with the sun or moon at the top of any page, or follow the device. Printed run sheets are always light.
- **Your levels.** A movement has a difficulty range, because springs and layers change how hard it is. Beginner, Intermediate and Advanced are always there (rename them if you like); mixed levels such as Beginner/Intermediate or Open level are yours to keep, delete or add, and each covers part of that range.
- **Get checks before you teach.** The app flags a class that opens with something hard, a tough movement with no lead-in earlier in the plan, a long run of hard holds with no relief, a missing cool-down or no back extension. It also checks every movement against who's booked in. Each caution is either **adjust** (teach it with the noted change, like keeping time on the back short in pregnancy) or **avoid** (with a suggested swap). Pregnancy is split into the first 12 weeks and after.
- **Short on time?** "Draft it for me" follows the class type: each phase gets its share of the class and a few blocks with room to build, warm-ups and cool-downs only use movements marked for them, the hardest work is kept for the peak, movements that share a spring setting sit together, and the plan is fitted to the class length. Then you change whatever you like.
- **Teach from Play mode** on your phone or tablet. Every flow in your list has a play button, so a class you've already built is one tap from starting. It shows only what you need mid-class: the movement and version, springs, reps, a countdown, your layers and variations, your own notes, client alerts and what's next, with a warning before a spring change. The picture, set-up and cues are one tap away.
- **Print a run sheet.** One page per class: what to set out before people arrive, then each phase with springs, changes, layers, finishers, reps and what you planned to offer.
- **Tidy springs.** One button reorders blocks inside each phase so shared spring settings sit together. Warm-up and cool-down are left alone, and you can undo it.
- **Undo and redo everywhere you edit.** Two arrows beside "Saved" step back and forward through your changes in a flow, in Studio settings and in the movement editor.
- **Timed lines.** Drop a water break or a change of set-up between blocks; it counts towards the class length and shows on the run sheet and in Play.
- **Phases are optional.** A class type, or a single flow, can be one list of blocks. Phases are still recommended: they help instructors plan the class the way clients expect it.
- **Review the library.** A review list lets a teacher work down every movement and mark it right or flag what's wrong. Flags can be fixed in the editor or downloaded and sent upstream.
- **Make it yours.** Edit any movement or series, build your own from scratch, take out what you never teach and put it back later. Add your own props, client cautions and muscle names.
- **Guide.** One page on setting up, the words the app uses (movement, block, phase, layer, series) and what each check looks at.
- **Your springs only.** Tell the app which reformers you have and how many of each spring is on them. Every setting is then shown in those springs and nothing else: Balanced Body, Merrithew/Stott, Peak, BASI, Align-Pilates, Flexia, classical or your own names and colours.

## For studio owners

OpenPilates is a free, open-source class planner you run yourself. There's no subscription, and no cloud company holds your clients' details.

- **Set it up once.** Rooms, reformer brand and springs, props, your class types (each with its own length, level, spring-change limit, timings, balance target and phases), your levels, focuses, class lengths, an editable timing list, the parts of a class and what a balanced class means to you. Everything else follows, for every instructor.
- **Packs.** Export everything your studio has changed (movements, series, class types, levels, lists, review marks) as one file. Bring it in on another server, or send it back to the project so your corrections reach the next version. Clients are never in a pack.
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

- Everything lives in `/data`: one SQLite database, plus a `media` folder for any photos your studio has added. To make a full backup, copy that folder.
- Admins can also download a JSON backup from **Team → Backup**. It contains settings, flows, clients, custom movements and notes, but no passwords and no photos.
- To update, pull the new image and recreate the container. Database changes are applied automatically. Library movements are refreshed from the image, and any studio edits you've made are kept.

---

## Movement library

The library is one JSON file per movement in [`library/movements/`](library/movements). Each file covers the name most teachers use and the other names it goes by, the part of the class it belongs to, the level range, which diagram to draw, starting position, spine movement, muscles, the usual spring setting and the one to advance to, headrest and straps, step-by-step set-up with the breath, teaching cues, layers, variations (regressions, progressions and other versions, with their own springs where needed), what stays still and what moves, a pregnancy note, lead-in movements, and cautions marked *adjust* or *avoid* with suggested swaps.

**All 184 starter movements (105 reformer, 79 mat) and 18 series are drafts.** We wrote them for OpenPilates in our own words. For 0.4 every one was cross-checked against several published references for its name, other names and spring range, and the majority view won where they disagreed; movements no reference confirmed were retired. [`library/SOURCES.md`](library/SOURCES.md) lists the references, and each file's `sources` field says which ones name that movement. Set-up, cues, muscles, levels and timings still need checking by a qualified instructor: use **Review the library** in the app.

Series live in [`library/series/`](library/series): a name and an ordered list of movements, each optionally with a variation.

You can contribute in two ways:
- Fix or add a movement file and open a pull request. Run `npm run check:library` first to check the file.
- In the app, an admin can edit any movement for their studio. Use **Download movement file** to share your version.

Please write descriptions and cues yourself. Don't copy them from books, courses or other apps.

**Pictures.** The diagrams are drawn by the app from a small set of poses in [`shared/poses.js`](shared/poses.js), so the library ships with no photographs. Photos you upload stay on your own server in `/data/media` and are never part of the library or an export. Only upload photos you took or have permission to use.

## How the analysis works

- **Spine movement** is the share of class time spent in flexion, extension, rotation and side bending. It's compared with a target you can edit per class type. The default is 50 / 25 / 12 / 13%. These measures come from [Kaleen Canevari's writing on class design](https://kaleenc.substack.com/p/what-makes-a-great-pilates-class-part-1).
- **Setting-up time** is estimated at 15 s per spring change, 20 s per position change and 45 s to put on or take off a box or jump board.
- **Springs** are stored as loads and shown in the springs each room really has, using the manufacturers' published charts. A setting that needs a spring you don't have is shown with the closest one and a `*`. Rename, recolour and count springs per room in **Studio**.
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
- `shared/`: vocabulary, analysis, the drafting logic and the diagram poses, used by both the server and the browser
- `public/`: the web app, plain ES modules with no build step
- `library/`: the movement library

## Roadmap

- Phone app (Android first), local-first, which can sync with this server later
- More movements, and more reviewed ones
- Cadillac/tower, chair and barrel
- More diagram poses, and props drawn in the pictures
- PDF export of the run sheet
- Sign-in with OIDC (for example Pocket ID or Authentik)

## Credits and licence

Made by **Sarah Blake** (Pilates teacher) and **Declan Plenty** (developer, Plenty Technologies).

- Code: [GPL-3.0-or-later](LICENSE)
- Movement library: [CC BY-SA 4.0](LICENSE-DATA.md)
