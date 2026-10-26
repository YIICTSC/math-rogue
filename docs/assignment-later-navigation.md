# Assignment “Later” navigation · 2026-10-26

Both assignment-letter presentations (title and game selection) now use `deferAssignmentAndContinue` in App. Previously they dismissed the letter and cleared every pending destination, so a learner who had just selected a game had to select it again.

| Pending action | After Later |
| --- | --- |
| Regular mini-game selection | Open its normal problem-mode selector; retain the selected mini-game until a mode is chosen. |
| Crane-game selection | Open the crane game with the title launch context, clearing stale event/challenge context. |
| Selected current FREE assignment and a mini-game | Apply the already selected assignment's problem configuration and open that game. Star Tide retains its required problem-selection confirmation first. A newly read, unaccepted inbox letter does not enable its configuration. |
| Cooperation, race, VR, kart or golf setup | Open the requested setup screen directly. |
| Continue paused at an optional assignment letter | Restore the held main-run state and its BGM. |
| Main adventure, typing or problem setup already behind the letter | Keep that setup screen. |
| Letter opened only from the inbox | Close it without launching a saved game. |

A dedicated ref distinguishes an actual Continue request from a save merely held while reading the inbox. The daily notice's zero-delay timer is canceled before dismissal so it cannot reopen the notice. Later does not start a daily assignment, mark work complete or remove a selected managed assignment. Required/launch-locked letters still provide no Later action; the shared handler also guards against bypassing them.

`node scripts/test-assignment-later-browser.mjs` uses the actual App and its launch handlers, both letter presentations, all 17 mini-game configurations, five direct setup destinations, the main adventure, optional FREE configuration, Continue, inbox close and enforcement guards. `node scripts/test-assignment-resume-bridge.mjs` preserves existing assignment-start/continuation behavior. The browser fixture waits for the actual mounted title before calling test-only exposed handlers.
