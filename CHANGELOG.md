# Changelog

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
