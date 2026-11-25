# Changelog

## 0.6.4

- **This is now OpenPilates Server.** The name on the sign-in page, the header, the browser tab and the start-up log says so. The repository is `d-plenty/OpenPilates-server`.
- **On pause.** Work has moved to the OpenPilates app for iPhone and iPad, which keeps everything on the device. This server still works as it is and will come back as the sync server for the apps.
- Nothing else changes: the Docker image is still `ghcr.io/d-plenty/openpilates`, and flow and pack files are the same, so the app can read them.

## 0.6.3

### Undo and redo
- **Two arrows beside "Saved"** step back and forward through your changes, in a flow, in Studio settings and in the movement editor. A run of typing counts as one step. Ctrl+Z and Ctrl+Shift+Z do the same when the cursor is not in a text box.
- In Studio the arrows cover every tab, so a deleted level, timing or part of the class comes straight back.

### Class types set more for you
- Open a class type in Studio → Classes and it can now set the **level**, the **balance target** and **its own timings** (seconds for a layer, a finisher, a spring change, a change of position, the box), on top of its length. A new flow of that type starts with all of it chosen.
- **"Spring changes, at most" can be empty or 0.** That means no limit: nothing is flagged, the limit is not shown anywhere, and drafts stop counting. The same choice is on each flow under More.
- **Phases are optional.** Untick "Plan this class in phases" on a class type and its flows are one list of blocks; drafts still open with a warm-up and finish with a cool-down. The phases you set up are kept for when you switch it back on. Any single flow can be switched between phases and one list under More. Phases stay recommended: they help instructors plan the class the way your clients expect it.

### Class levels
- Levels are the same for every class. **Beginner, Intermediate and Advanced are always there** and cannot be deleted (you can rename them).
- **Beginner/Intermediate, Intermediate/Advanced and Open level** sit under them as examples: keep them, delete them, put them back, or add your own.
- A studio set up on an earlier version gets the missing ones added once. First set-up no longer asks which levels you run.

### Timing list you can edit
- Every row can be **renamed**, given a **note** for your team, and have its seconds changed. Remove the ones you don't count (a built-in row you remove counts for nothing and can be put back).
- **Add your own rows**, such as a water break or setting up the tower. Your own rows can be dropped into any flow as a **timed line** between blocks: it adds to the class length and shows on the run sheet and in Play. You can also type a one-off timed line on a flow.

### Parts of the class
- **Add your own** parts and say whether each counts as lower body, upper body, core or stretch in the balance charts.
- **Delete** any part. You are asked which part its movements and class phases move to, and nothing else about those movements changes. A built-in part you deleted can be put back, with its movements.

### Focuses
- Studio → Classes has a **Focuses** list: Full body, Core, Glutes, Legs & glutes, Arms & shoulders, Back & posture, Posterior chain, Mobility, Stretch & release, Prenatal and Rehab-friendly to start with. Rename, delete and add, and tick the muscles a draft should favour for each.
- An instructor can **type their own focus** for a class, when starting a flow or later in the builder. It shows on the flow, in the flows list and on the run sheet.

### Pictures
- **Simpler heads.** The figures no longer have a face drawn on them. A hair bun at the back and a hint of a nose still show which way the figure is facing.

### Also
- The flow's title and settings now have the full width of the page, so the settings sit on one or two rows.
- Packs carry the timing list, focuses and parts of the class, and a pack from an older version still brings its timing in.
- Fixed: exporting a flow could fail once it held anything that was not a movement.

## 0.6.2

- **Fixes the Docker image build, which 0.6.1 broke.** 0.6.1 told Docker to copy the `tools` folder into the image while `.dockerignore` still left that folder out, so the build stopped and no new image was published. Servers stayed on the last image that did build. Nothing in the app itself changes.
- A test now checks that everything the Dockerfile copies exists and is not left out by `.dockerignore`.

## 0.6.1

- **Show password.** Every password box (sign in, first set-up, account) has an eye beside it to show what you are typing.
- **Change your password without the old one.** Account → Password asks only for the new password. Being signed in is enough, so a forgotten password can be replaced from any device that is still signed in. Other devices signed in to the same account are signed out when it changes.
- Locked out completely? `node tools/reset-password.js <username> <new password>` inside the container sets a new one.

## 0.6.0

### Pictures that match the movement
- **Every movement has its own frames.** Before, 138 movements shared 47 pictures, so Running, Footwork and Calf Raises all showed the Footwork drawing. Now 105 movements have frames drawn for what they do, and only one pair still shares a picture (Pelvic Curl and Bridge with Magic Circle, which move the same way).
- **Running** shows the carriage pressed out with one heel under the bar and the other knee bent, then the legs swapped. **Calf Raises** shows straight legs with the heels lifting and lowering.
- **Three frames where a movement has three parts**: Coordination, Backstroke, Breaststroke, Short Spine, Rowing Back, Draw a Sword, the arm circles, Inchworm, Boomerang, Jackknife, Crab and more. Alternating movements are labelled "One side" and "The other"; holds show a single position.
- Later frames carry a faint print of the frame before, so you can see what moved. Frames are larger on the movement page.
- Feet can now point or flex in a drawing, which is what lets a heel drop read.

### More movements
- **15 more**, each named in a published reference (listed in `library/SOURCES.md`), with springs, muscles, steps, layers, variations, cautions and its own frames.
  - Reformer: Pelvic Lift, Supine Arms: Circles, Kneeling Side Splits, Mountain Climbers, and Curtsy Lunge (brought back now that a published class names it).
  - Mat: Scissors and Bicycle (on the shoulders), Crab, Control Balance, Knee Folds, Supine Spine Twist, Chest Lift with Rotation, Leg Slides, Arm Arcs, Thigh Stretch.
- 184 movements in all: 105 reformer, 79 mat.
- "Pelvic lift" is no longer another name for Bridging, because it is its own movement now.

### Light and dark mode
- A sun or moon at the top of every page switches it. Account → Appearance offers Light, Dark or Follow this device. The choice is kept per browser.
- Every screen, chart and diagram follows the theme. Printing is always light.

### Under the hood
- Poses can carry a middle frame (`m`), frame names, and a foot direction. A frame that gives a limb angles lets go of the point that limb was reaching for.
- The stylesheet's fixed colours became theme variables.
- 53 automated tests (the pose test now checks every limb in every frame) and a 22-step browser click-through.

## 0.5.0

A rework around how classes are really planned: the studio is set up once, a class is built from blocks inside timed phases, and everything in the app can be edited, added, removed and moved between servers.

### Studio: set up once, everything follows
- Studio is now four tabs (Rooms & springs, Classes, Lists, Library & data) and saves as you go.
- **Class types**: the classes on your timetable, each with its phases in order, the minutes each phase gets, which parts of the library fill it, and a spring-change limit. Four are built in (Reformer Flow, Reformer Fit, Reformer Foundations, Mat Flow). Edit, duplicate, delete or add your own, or put the built-in ones back.
- **Class levels**: pick Beginner / Intermediate / Advanced, Beginner-Intermediate / Intermediate-Advanced, five levels, or Open / Advanced, or write your own names. Each level covers a span of difficulty, and that decides what a class at that level is offered. The whole app uses your names.
- **Class lengths** and the usual length, and **timing**: the seconds allowed for a spring change, a change of position, a box or board, each layer and a finisher.
- **Lists**: add your own muscle names and rename the parts of a class, alongside props and client cautions. Your own list entries can be renamed.
- First-run set-up asks which level names you use.

### New flow
- Starts from a class type. Pick length, level and focus, see how the minutes are shared between phases, then draft it or start with the empty phases.
- Two more focuses: upper body, and legs and glutes.

### Builder: blocks
- A flow is phases filled with **blocks**. A block is one movement plus what you build on it.
- **Plan block** opens the block where it sits, no dialog: version, springs for the class, support and challenge springs for individuals, layers, finisher, reps, a note, and what to offer anyone who needs less or more.
- **Layers in your own words.** Type a layer and press Enter, or pick from the movement's own layers. Reorder, reword or remove them.
- **Finishers**: pulses, a hold, or anything you type.
- **Time that adds up.** A block's time is the movement's own time plus time for each layer and the finisher, until you type a time yourself. Each phase shows its time against the minutes it was given, in amber when short and red when over.
- **Add a block** at the foot of every phase opens a searchable picker that starts on what suits that phase. Works on a phone, where dragging doesn't.
- **Suggest blocks** fills an empty phase, or adds one more block to it, by the same rules as a draft and without repeating anything already in the flow.
- The phase header is one line. Song, "one side then the other", save as a series and delete sit behind the edit button.
- The library pane is a compact list with filters folded away, and can be limited to the class level.
- Class type, level, length and room are at the top of the flow; apparatus, balance target and spring limit are under More.

### Drafts rebuilt
- A draft follows the class type: each phase gets its share of the class and a few blocks, not a long list of two-minute movements.
- Warm-ups and cool-downs only use movements marked for them. The hardest work is kept for the peak.
- Blocks get layers from the library when there is time for them, and the last block of a strength phase gets a finisher.
- Time is shared by what each movement can carry, and the plan is fitted to the class length including spring, position and box changes.
- Spine balance is steered toward your target while the class is filled.
- A hard block is drafted with a regression already planned, taken from the movement's own variations, and a movement that needs a lead-in waits until one is in the class.
- The lead-in check now only speaks up for hard movements.
- Every movement now has layers to build with (36 had none).
- Every movement now says where it belongs in a class (warm-up, cool-down, peak). All 169 are marked as a first pass; correct them on the movement's Edit page.

### Edit everything
- **Series editor**: make a series from scratch, or change any series' name, order, versions and movements. An edited built-in series can be put back.
- Movement editor: where it belongs in a class, difficulty shown in your level names, a body map that fills in as you tick muscles, layers that reorder, and a save bar that stays in view.
- Explorer: six ways to browse up front and the rest one press away, one tidy column of categories, calmer cards, and browsing by place in the class and by who has checked it. Cards show "Checked" and "To fix".
- The movement page packs its cards into columns, lists layers as a numbered build, and labels Remove, Reset and Delete in words.
- **Packs**: Studio → Library & data exports everything your studio has changed as one file (movements, series, class types, levels, lists, timing, review marks, what you removed, and optionally your flows) and brings a pack in, with a tick list of what to take. Clients are never in a pack.

### Analysis and review
- The Analysis tab packs its cards into columns, and talks about blocks.
- The review list shows where each movement belongs in a class and its layers, with an Edit shortcut on every row, so they can be checked in the same pass.

### Run sheet and Play
- Both show the block as planned: version, numbered layers, finisher, support and challenge springs, offers and your note.

### Under the hood
- Flows keep `classType`, phase `minutes`, free-text layers and `finisher`. Older flows open unchanged.
- New: `PUT /api/series/:slug`, `GET /api/pack`, `POST /api/pack/import`.
- 53 automated tests and a 21-step browser click-through at desktop, tablet and phone widths.

## 0.4.1

- **Back puts you where you were**: filters, the open category, search and scroll position are kept, including with the browser's back and forward buttons and after a reload.
- The explorer's flow builder is a drawer at the side behind a small tab, not a bar across the bottom.
- Studio can add, remove and restore **props** and **client cautions**.
- Movements and series can be **removed from your library and put back** (Movements → Removed). Retired movements can be brought back the same way.

## 0.4.0

A rework for working instructors: checked names and springs, variations, series, a stripped-back Play mode and navigation that takes you back where you came from.

### Movement library
- Every movement was cross-checked against several published references for its name, other names and spring range. Where they disagreed the majority won, including over the training manuals the first drafts leaned on. `library/SOURCES.md` lists the references and each movement records which ones name it.
- 15 movements that no reference confirmed, or that duplicated another entry, are retired. They are no longer offered, but flows that already use them still open. The library is now 100 reformer and 69 mat movements.
- **Names.** Each movement leads with the name most teachers use and lists what else it is called (classical name, nickname). Search finds all of them: "prances" finds Running, "pelvic lift" finds Bridging. Suffixes like "(Reformer)" are gone.
- **Springs corrected** on 59 reformer movements, among them Bridging, Mermaid, Pulling Straps, Knee Stretches, Elephant, Long Stretch, the supine arm and abdominal work, the kneeling arm work, Scooter, Lunge, Side Splits and Snake.
- **Muscles and sections corrected** on 13 reformer movements: Offering, Serve a Tray, Chest Expansion, Elephant, Knee Stretches, Tendon Stretch, Down Stretch, Backstroke, Coordination, Draw a Sword, Rowing Front, Horseback and Long Back Stretch. The rest were read through and left as they were, so muscles are the part of each entry most in need of a teacher's eye. Knee Stretches no longer turns up in a standing-legs block.
- **Variations** replace the old "easier options" list. A variation is a regression (simpler), a progression (harder) or another version, and can carry its own springs. Arm work has single-arm variations on a lighter spring; Footwork has its foot positions and single leg.
- **Series**: 18 ready-built runs, including Footwork, Feet in Straps, Supine Arms, Kneeling Arms (facing front, back and side), Rowing, Long Box, Short Box, Long Stretch, Stomach Massage and Knee Stretch on the reformer, and the Series of Five on the mat. "Footwork Series" as a single movement is now Footwork plus a series.
- New: Jackknife on the reformer and Jackrabbit.
- All entries are still drafts for a teacher to review.

### Springs
- Every spring setting is shown only in the springs your reformers have, as set in Studio. The table of every other brand is gone from the movement page.
- A setting that needs a spring you don't have shows the closest one with a `*`.
- The explorer's "By springs" lists real settings on your machine ("1 Blue", "2 Red", "1 Blue + 1 Red"), lightest first.

### Builder
- The item dialog is now **Layers & variations**: teach as (which version the class does), springs, layers to build, and variations to offer individuals, with regression, progression and variation kinds.
- The library pane has a **Series** tab. Adding a series drops all its movements in, ready to edit. Any segment can be saved as a series for the studio.
- Clicking a movement in the builder opens a quick look without leaving the flow.
- Rows read plainly: muscles, then "20–30 reps".
- BPM is gone. A segment can still note a song or playlist.
- Drafts open the footwork block with Footwork, never use retired movements and pick a candidate that stays inside the spring limit.
- Tidy springs can no longer leave a flow with more changes than it started with.

### Play mode
- Shows what an instructor needs mid-class and nothing else: movement and version, springs, reps, countdown, layers and variations, your own notes, client alerts and what's next.
- Picture, set-up and cues are folded away behind one button.
- Exit returns to wherever Play was started from.

### Navigation
- "Back" from a movement returns to the flow, explorer or review list you came from.
- Dialogs close when you move to another page.

### Pictures
- The figure now has a face, hair, hands and feet, so you can tell at a glance whether the body is on its back, on its front, on its side or which way it is kneeling.
- Eight new poses, so Overhead, Jackknife, Corkscrew, Chest Expansion, Long Back Stretch, Tendon Stretch and the strap-free long box work no longer borrow the wrong picture.
- Small thumbnails show the start position only.

### Review
- **Review the library** lists every movement with "Looks right" and "Needs fixing", a note, filters and search. The same bar is on each movement page.
- Flags can be downloaded as a file to send to whoever maintains the library.

### Guide
- Rewritten for instructors: what the app means by movement, variation, layer and series, how springs follow your studio, and what each check looks at.

### Upgrading
Nothing to do. Flows from earlier versions open as they are: easier and harder options become regressions and progressions, and movements keep working under their new names. Movements your studio has edited keep your version; reset one to pick up the new library entry.

## 0.3.0

A rework of the builder and the library, plus a click-through test of every screen.

### Layers and options inside a flow
- Each movement in a flow has an options button. From there you can:
  - choose the springs for this class: follow the plan, the usual setting, the advance setting, or your own
  - tick the layers you plan to teach
  - add options for the room: harder springs, easier springs, a movement added inside the movement, or a note of your own
  - pull ideas straight from the movement's library entry
- Options show under the movement in the builder, on the run sheet and in Play mode.
- An added movement counts towards the muscles, categories and equipment of the class.
- New check: a hard movement with no easier option planned.

### Getting to a class faster
- Every flow card has a large play button in the top right corner.
- **Run sheet** tab: a printable page with what to set out, then each segment with springs, spring changes, reps, layers and options. Cues can be shown or hidden.
- **Set out before class** card: starting springs, straps and every piece of equipment the class needs, with a warning for anything the room doesn't have.
- **Tidy springs** reorders movements inside each segment to cut spring changes, with undo. Warm-up and cool-down keep their order.

### Levels
- Movements now carry a level range, such as Beginner–Intermediate or Intermediate–Advanced, or All levels. Filters and drafts use the whole range.

### Pictures
- Every movement has a drawn diagram showing the start position and, faintly, the finish. About 70 poses cover the reformer and mat library.
- Admins can add the studio's own photo to any movement, with a credit line. Photos are shrunk in the browser and stored in `/data/media`.

### Movement library
- 182 movements, up from 133: 110 reformer and 72 mat.
- New reformer work includes more footwork and bridging variations, kneeling and standing arm work, long and short box series, side splits and standing work, plank and pike variations, classical pieces such as snake, tendon stretch and control balance prep, and more stretches.
- New mat work fills out the classical order, adds standing and prop work, and more side-lying and prone options.
- All entries are still drafts that need an instructor's review.

### Guide
- New **Guide** page in plain language: the parts of a reformer, how springs work in your studio's colours, levels, layers and options, what each check means, and how the pictures work.

### Fixed
- Filter chips (Mine, Shared, Reformer, Mat and others) now highlight when chosen.
- Clicking a tick box or typing in a segment no longer loses the click.
- A read-only flow no longer shows a save error when you leave it.
- "Reset to library version" now refreshes the page.
- A refused role change in Team no longer leaves the wrong role showing.
- Signing out returns you to the sign-in page.
- Phone: the Clients table no longer pushes the page sideways, and the Explorer's flow bar stays a thin strip.
- Effort chart labels no longer overlap on short segments.

### Upgrading
Nothing to do. Flows from 0.1 and 0.2 open as they are. Library movements refresh on start, and movements your studio has edited keep your version.

## 0.2.0

A reformer-first update. The library, the class checks and the draft generator were rebuilt around how a reformer class is actually planned and taught.

### Movement library
- 133 movements, up from 58: 82 reformer and 51 mat.
- Reformer movements are grouped by where they sit in a class: legs & glutes, hips & pelvic stability, back & shoulders, single-arm work, chest & arms, core, stretch & mobility, and jump board.
- Every movement, reformer and mat, now has the same shape:
  - the usual spring setting and the setting to advance to (and whether lighter is harder)
  - headrest, straps and box
  - step-by-step set-up with the breath
  - teaching cues, layers and easier options
  - what stays still and what moves
  - a pregnancy note: fine, a good option, keep time on the back short, first 12 weeks only, or not in pregnancy
  - lead-in movements for the harder ones
  - cautions marked **adjust** or **avoid**
- New caution tags: pregnancy in the first 12 weeks, hip pain, groin strain and SI joint.
- All entries are still drafts that need an instructor's review.

### Class analysis
- **Spring map.** The plan works out which setting each movement runs on. A movement stays on the springs already set when its usual or advance setting matches, and one extra-light spring on or off isn't counted. Each flow has a spring-change limit (three for Flow and Fit classes).
- **Class balance.** Time on lower body, upper body, core and stretch; stability versus mobility; and which of eleven movement categories are covered.
- New checks: starts or ends on a hard movement, no lead-in for a harder movement, a long run of hard stability work, no stretch or relief, little change of body position.
- **Repeat other side** on a segment doubles its time without doubling the movement count.
- Client checks separate "adjust" from "avoid", and only "avoid" gets a swap.

### Drafts
- Reformer drafts come in two styles, Flow and Fit (Fit adds a jump-board block if the studio has boards).
- Drafts are built in body-section blocks, open with footwork, keep shared spring settings together and aim to stay inside the spring limit.
- Prenatal drafts keep time flat on the back to the warm-up.

### Screens
- Builder: spring-change markers between movements, a Springs card, class style and spring limit, filter by part of the class.
- Analysis: Springs and Class balance cards.
- Movement page and editor: all the new fields.
- Explorer: browse by part of the class, movement category, stability/mobility and pregnancy.
- Play mode: set-up steps, cues, easier options, first/second side, and a warning before a spring change.

### Upgrading
Nothing to do. Flows saved in 0.1.0 open as they are, and library movements refresh on start. Movements your studio has edited keep your version; reset one to pick up the new library entry.

## 0.1.0

First release.
