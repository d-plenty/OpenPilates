# Overnight rework: where things stand

Go-ahead given 23 Nov 2026, 22:30 (Brisbane): run stages 0-4 back to back, then hand over for Declan and Sarah to edit.

## Rules for this run
- No Claude/AI attribution in commits.
- Every change gets an impact pass (see docs/CONCEPTS.md once written).
- Each stage ends with: tests, library check, browser click-through, a commit, a zip in /home/claude.
- Client data never leaves the server in any export.

## Stages
- [x] 0. Research and design (docs/DESIGN.md, docs/CONCEPTS.md)
- [x] 1. Studio as set-and-forget (+ ship the four 0.4.1 changes: real back, flow drawer, studio props/cautions, remove/restore)
- [x] 2. Builder, teach mode and drafts rebuilt around blocks
- [~] 3. Full editing and export/import pack done; library depth (content pass, more movements, mat parity) still open
- [x] 4. Look and layout: builder, new flow, studio, explorer, movement page and editor, analysis and review

## Log
- 01:10 Third cut: analysis packs into columns, review rows show class placement and layers, drafts plan a regression for hard blocks, lead-in check limited to hard movements. 53 tests, 21/21. Final zip rebuilt and sent. No further wake-up scheduled: what is left (content accuracy, new movements) needs Sarah.
- 00:40 Second cut packaged: layers on all 169 movements, Suggest blocks per phase, movement page columns. 53 tests, 21/21 click-through.
- 23:59 0.5.0 packaged. Series editor, block picker, explorer simplified, guide/README/changelog, 21/21 click-through, upgrade path checked.
- 02:10 Stages 1 and 2 core committed (13de5ca): studio tabs, class types/levels/lengths/timing, new-flow from a class type, block editor inline, drafts rebuilt, packs, 52 tests.
- 22:35 Started. 0.4.1 changes are in the working tree, click-through running.
- 23:40 Stage 0 done. Key finding: teachers plan in blocks (set-up + spring, layers 1-3, finisher, other side later).
- 23:40 0.4.1 changes committed: back returns you where you were (filters, scroll, browser back/forward, reload), explorer flow builder is a side drawer, studio can add/remove props and client cautions, movements and series can be removed from the library and put back (/removed). 46 tests, 34 browser steps pass.

## Decisions made without asking (so the run does not stall)
- Studio settings save themselves a moment after each change (no Save button), the same as flows.
- A movement's difficulty stays on three fixed steps; a studio's class levels each cover a span of those steps.
- Drafts only use movements marked Warm-up / Cool-down for those phases ("Where it belongs in a class" on each movement; I marked the library, Sarah should correct it).
- A block's time = the movement's own time + time per layer + finisher (Studio > Classes > Timing), unless a time is typed on the block.
- Packs leave out clients always, and rooms are only brought in if ticked.
- Flow builder in Movements: closed by default, small tab bottom right.
- Filters are remembered per browser tab; the builder shows "Clear filters" when any are on.
- Removing a built-in prop or caution never deletes data that mentions it.

## Next
0.5.0 is packaged: /home/claude/openpilates-0.5.0.zip (52 tests, library check, 21/21 browser steps in /home/claude/audit/audit5.py, upgrade from a 0.4.1 data folder checked).
If there is still time, in order of value:
1. Content pass: check every movement's muscles, warm-up/cool-down/peak marks, layers (many have none) and mat/reformer parity; add missing staples.
2. Look pass on the movement page, review list, clients, analysis tab.
3. Per-phase "Suggest blocks" in the builder (reuse the draft's phase filler).
Screens: /home/claude/audit/look5.py (server 8498, DATA_DIR /tmp/oplook, sarah / pilates-test-123). Click-through: audit5.py (own server on 8499, about 3 minutes).

## 0.6.0 (go given 24 Nov 04:56)
Done: Running and Calf Raises redrawn; every movement that shared a picture has its own frames (poses.js, the `V(...)` block); middle frame and foot direction in the solver; 15 movements added with references; light and dark mode (public/js/theme.js, variables at the top of app.css). 53 tests, library check, 22/22 click-through (audit5.py). Contact sheets: /home/claude/audit/msheet.py.
Not done: no further new movements beyond what a reference names; Sarah's content review still outstanding.

## 0.6.3 (go given 24 Nov 17:39) — built
All nine requests from 17:10 and 17:38 are in:
1. Undo/redo beside "Saved": `undoStack` in public/js/ui.js, used by studio.js, flow.js, movement.js.
2. Class type editor: level, balance target, own timings (`ct.timing`), spring limit blank/0 = none, phases optional (`ct.noPhases`, phases kept).
3. Levels: core three locked (`isCoreLevel`, `withCoreLevels`), examples deletable, seeded once for older studios (`studio.levelsSeeded`).
4. Timing list: `studio.timingRows` (built-ins rename/note/off; custom rows `t_…`); `studio.timing` is derived from it. Custom rows are offered as timed lines in a flow (`item.pause`).
5. Parts of the class: `customSections`, `removedSections`, `sectionMap` (where a deleted part's movements went). `sectionOf` follows the map.
6. Focuses: `studio.focuses` (vocab `FOCUSES`), `flow.focusText` for an instructor's own.
7. Heads redrawn in figure.js (no face).
8. Flows: `springBudget` 0 = no limit; `flow.noPhases` = one list.
Checks: 59 tests, library check, 25/25 click-through (audit5.py, about 4.5 minutes now).
Still outstanding from Declan/Sarah: Sarah's content review and a pack export.
