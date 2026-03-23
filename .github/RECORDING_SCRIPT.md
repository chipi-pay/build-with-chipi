# Recording Script Template

Every tutorial recording follows this structure. Not a word-for-word script — guidance for what to say and show at each phase.

**Branding:** Always say "Chipi" — never "Chipi SDK" or "Chipi Stack". Package names are technical details, only in install commands.

---

## Open with Use Cases (30 seconds)

Start by inspiring. Before touching code, tell people what they can build:

> "With what we're building today, you could make [idea 1], [idea 2], or [idea 3]. We're going to build the foundation — you take it wherever you want."

Each tutorial issue lists 3 use case ideas. Pick the ones that excite you.

## Intro (15 seconds)

> "Hey! I'm [name]. Today we're building [what] with Chipi latest. Following the docs at docs.chipipay.com."

**IMPORTANT:** Say "Chipi latest" — NEVER mention a specific version number. Since we auto-update dependencies, version numbers make videos look outdated. "Latest" is always true.

## Setup (1-2 minutes)

Show: terminal + docs page side by side.

> "Following the quickstart... installing Chipi... [show terminal]. App is running. Let's test."

## Testing Features (3-5 minutes)

For EACH feature:
1. Show the docs page
2. Show the code
3. Test it live

When it WORKS:
> "Creating a wallet... passkey prompt... got the address. That's a pass."

When it FAILS:
> "This didn't work. The docs say [X] but I got [error]. I'm filing this as a bug in [repo]."

Don't fix bugs on camera. File them, mark FAIL, move on.

## Close with Use Cases (30 seconds)

End by connecting back to real projects:

> "So now you have [what was built]. From here you could turn this into [idea 1] or [idea 2]. The code is in the PR, link below. [X] out of [Y] features passed. [N] bugs filed. See you next time!"

---

## Recording Setup (use for EVERY recording)

**Screen size:** 1920x1080 (Full HD). Set your display resolution before recording.

**Browser zoom:** 100% (never zoomed in/out)

**Terminal font size:** 16px minimum (readable on mobile)

**Browser font size:** Default (16px)

**Recording tool:** OBS Studio (free) or QuickTime (macOS built-in)
- OBS: Settings → Video → Base Resolution: 1920x1080, Output: 1920x1080, FPS: 30
- QuickTime: File → New Screen Recording → select full screen

**Export format:** MP4, H.264, 1080p, 30fps

**Audio:** Built-in mic is fine. No background music.

**Screen layout:**
- Split screen: docs on left (50%), code/app on right (50%)
- Or tab-switching: show docs tab → switch to code tab → switch to browser tab
- Terminal always visible when running commands

**Before recording checklist:**
- [ ] Screen resolution set to 1920x1080
- [ ] Browser zoom at 100%
- [ ] Terminal font size 16px+
- [ ] Close all unrelated tabs and notifications
- [ ] Dark mode or light mode — pick one and use it consistently across ALL tutorials

---

## Rules

1. Always say "Chipi latest" — NEVER mention a version number
2. Always show the docs page you're following
3. Open or close with real use case ideas (from the issue)
4. Don't fix bugs on camera — file them and move on
5. 5-8 minutes total
6. Things breaking = also great content — shows we find and fix issues
7. SAME screen setup for every recording (1920x1080, same theme, same layout)
