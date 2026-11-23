# Concept map: when one thing changes, check all of these

For every change, find the concept below and walk its list. Add to the list when a new
screen starts using the concept.

| Concept | Lives in | Shown or used by |
|---|---|---|
| Movement name / other names | movement file, `namesOf` | explorer cards + search, builder library + rows, quick look, movement page + editor, review list, removed list, run sheet, teach mode, drafts, series lists, analysis checks text, exports |
| Level | movement `level`/`levelTo`, studio level scheme | cards, movement page + editor, review list, explorer "By level", flow header, new flow, drafts, analysis "above level", class types |
| Springs | movement `load`, variation springs, item pin, studio room springs | `springDots` everywhere, explorer "By springs", builder rows + change markers, springs card, set-out card, block alternatives, run sheet, teach mode, movement page + editor, review list, drafts, tidy springs, analysis plan |
| Variation | movement `variations`, item `variation`, item `options` | builder row + dialog, quick look, movement page + editor, run sheet, teach mode, series items, analysis spring plan + regression check, drafts |
| Layer / finisher | item `layers`, `finisher`, movement `layers` | builder block card + dialog, run sheet, teach mode, time model, drafts |
| Series | library/series, studio series | builder library tab, explorer "By series", removed list, save-as-series, pack |
| Props | `EQUIPMENT` + studio lists | Studio, movement editor + page, explorer "By equipment", builder "only equipment we have", set-out card, analysis missing kit, drafts |
| Client cautions | `CAUTIONS` + studio lists | Studio, client editor + list, movement editor + page, builder flags, client checks, teach mode alerts, drafts |
| Class type | studio `classTypes` | Studio, new flow, flow header, drafts, analysis spring limit |
| Parts of the class | `SECTIONS` | movement editor + page, explorer, builder filter, analysis balance, class types, drafts |
| In / out of library | movement `hidden`, `retired`, studio visibility | store lists, explorer, builder library, removed list, movement page, drafts, series |
| Review status | movement `check` | movement page, review list, explorer count, cards, pack |
| Where you were | `viewState`, `nav` | explorer, flows list, builder, review list, clients, back links, teach mode exit |
| Time | movement `duration`, item `duration`, studio timing | builder rows + block time, stat tiles, analysis, run sheet, teach mode, drafts, class types |

## Added in 0.5

| Concept | Where it lives | Every place that must follow it |
|---|---|---|
| Class type | `studio.classTypes` (phases with minutes, sections, positions; spring limit) | Studio > Classes editor; new-flow screen; `draftFlow` / `blankSegments`; flow header select; flows list and run sheet labels; block picker's "suits this phase"; pack export/import |
| Class level | `studio.levels` (id, label, from, to) applied by `applyStudioLists` into `CLASS_LEVELS` | `classLevel`, `levelLabel`, `levelsOf`; new-flow chips; flow header; flows list; run sheet; explorer "By level"; builder library "Only … level"; drafts (`levelRange` against the level's span); analysis `flowLevel`; movement editor hint; set-up wizard |
| Block | a flow item: `variation`, `load`, `layers` (tag or `{text}`), `finisher`, `options`, `reps`, `note`, `duration` | `blockEditor` and `itemExtras` (options.js); `blockSeconds`/`itemDuration`; `cleanFlow`; run sheet; Play; analysis timing; series (keeps slug, variation, duration, reps only) |
| Phase minutes | `segment.minutes` | builder phase header (over/under); `blankSegments`; drafts; `cleanFlow` |
| Timing | `studio.timing` applied into `TIMING` | `blockSeconds`; analysis transition costs; drafts' fit-to-length; Studio > Classes > Timing |
| Place in the class | `movement.uses` (warmup, cooldown, peak), `usesOf` falls back to labels and effort | movement editor; drafts; block picker; explorer "By place in the class"; `cleanMovement`; library JSON |
| Pack | `GET /api/pack`, `POST /api/pack/import` | Studio > Library & data; never includes clients or `booked`; README; guide |
