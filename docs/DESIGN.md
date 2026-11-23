# Design notes for the 0.5 rework

Written before any code, from two things: published class plans by working group-reformer
teachers, and what other planning apps offer. Nothing here is copied text; these are the
patterns and the decisions that follow from them.

## What real class plans look like

Two full plans from a teacher-training resource (a 50-minute level 1 class and a 46-minute
level 2 class) are written the same way:

- A class is **8 to 10 blocks**, about 4 to 6 minutes each. Not 18 separate movements.
- A block is **one set-up**: a position, a spring, maybe a prop. Then **Layer 1, Layer 2,
  Layer 3**, each adding to the one before (a hold, an arm, a pulse), then a **finisher**
  (hold, pulse, "last 5").
- Springs are written per block **with a choice**: "white for challenge, blue for support".
- Spring and box changes are written as their own lines between blocks.
- One-sided blocks run as a circuit, then **the whole circuit is repeated on the other side**
  later in the class.
- The order is: warm-up (roll down, pelvic curl), footwork, abdominals, then the standing /
  kneeling / plank circuit, arms, other side, cool-down (legs in straps, roll up).
- Timings are loose. The only number in one plan is "hold 10 seconds".

Other formats seen: classical order (a fixed list, a few reps each, no layers) and
fitness-style classes in four blocks (foundation, front, back, stretch). The app has to do
both a layered block and a plain list.

## What other planning apps have in common

Library tagged by muscle group, equipment, movement pattern and pacing; custom exercises with
notes, springs and props; warm-up / main / cool-down phases with drag and drop; templates;
a live teach mode with timers; share and export. None of that is our edge. Ours is: the
studio's own springs and levels everywhere, the spring plan, checks against who is booked,
self-hosted and free.

## Decisions

1. **The block is the planning unit.** A movement in a flow becomes a block card: the base
   movement and version, springs with a support and a challenge alternative, layers written
   in the teacher's own words (with one-press suggestions from the library), a finisher, and
   a time for the whole block. A plain list still works: a block with no layers.
2. **Time is per block and realistic.** Default = the movement's own time + time per layer +
   finisher. Class types say how many minutes each phase gets. Fewer blocks, done properly.
3. **Class types live in Studio.** A class type is a name, length, level, spring-change limit
   and an ordered list of phases with minutes and what belongs in each. New flows start from
   one. Drafts fill the phases. Replaces the fixed Flow / Fit / Open styles and goals.
4. **Levels live in Studio.** Three levels, two overlapping levels, or the studio's own names.
   Movements keep a three-step range underneath; every screen shows the studio's names.
5. **Warm-up, cool-down and peak are properties a teacher sets** on a movement, not guesses
   from effort. Drafts only put a movement in a warm-up if it is marked for one.
6. **Everything is the studio's.** Any list (levels, class types, lengths, parts of the class,
   props, cautions, muscles, timing) can be added to, renamed and removed, with the built-in
   entries restorable. Any movement or series can be edited, removed and put back.
7. **A pack file** carries everything a studio has changed (movements, series, lists, class
   types, review flags; never clients) out and back in. It is how corrections from a teacher
   reach the next library version.
8. **Screens show what the task needs.** Builder: the plan. Teach mode: the next thing to say.
   Library entry: springs, version, layers first; reference detail below.

## Sources read for this
- OnForm Pilates teaching resources: Reformer 1 and Reformer 2 example class plans
- App listings and sites: The Class Plan, TunaMat, Forme, Plush Pilates, Rō Instruct, ProPlannr
- Les Mills Reformer class structure
- Earlier: see library/SOURCES.md
