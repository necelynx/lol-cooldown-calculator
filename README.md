# LoL Cooldown Calculator — README

A self-contained, offline HTML/CSS/JS tool for calculating League of Legends ability cooldowns (Q/W/E/R) by champion, champion level, and ability haste.

## How to run it

No install, no server. Unzip the folder and double-click `index.html`. Everything (champion data, styling, logic) is bundled into the four files below — nothing is fetched from the internet at runtime.

Files:
- `index.html` — page structure
- `style.css` — dark legacy/fansite theme
- `data.js` — all champion ability data, inlined as a JS variable (`CHAMP_DATA`)
- `app.js` — all calculation and UI logic

## Features

**Champion selection**
- Type-ahead search box that filters the champion list live as you type.
- A scrollable list of all champions in the sidebar; clicking a name selects that champion and highlights it.

**Inputs**
- Champion Level: number field (1–18) plus a matched slider, kept in sync.
- Ability Haste: number field, uncapped, defaults to 0.

**Cooldown table (per champion)**
- One row per ability: Q, W, E, R.
- Ability name, current rank, base cooldown (seconds), and effective cooldown (both `Xm Ys` format and raw seconds).
- Abilities not yet learned at the selected level show "not learned" instead of a cooldown.

**Rank estimation**
- Because Q/W/E don't have a single "correct" rank at a given level — it depends on what order a player levels them in — the tool auto-estimates rank using each champion's most common skill-max order:
  1. Levels 1–3: one point each into Q/W/E, in priority order.
  2. Levels 4–18: continue maxing the highest-priority ability first, then the next, then the last, except—
  3. R levels up at 6/11/16 (or fewer breakpoints for champions with fewer than 3 ultimate ranks) whenever it isn't already maxed, taking priority over Q/W/E at those levels.
  4. Any ability whose Data Dragon cooldown array has only one entry (a flat, rank-independent cooldown) is always treated as active — this handles edge cases like Jayce's ultimate.
- Manual override: every ability row has its own rank dropdown. Selecting a specific rank overrides the auto-estimate for that ability only; a "manual override" tag appears so you know it's no longer using the estimate. Switching champions resets overrides.

**Ability Haste formula**
- `Effective CD = Base CD ÷ (1 + Ability Haste ÷ 100)`
- Uncapped, no diminishing returns — matches current Riot ability haste mechanics (this replaced the old flat-percent CDR system).

## What the data is and where it came from

**Base cooldowns (all ranks, all champions, all 4 main abilities):**
Pulled directly from Riot's official Data Dragon game data files (`ddragon.leagueoflegends.com`), patch 16.16.1, covering all 173 champions currently in the game. This is Riot's own machine-readable game data — not a wiki, not a fan transcription — so it's the most authoritative possible source for the numbers themselves. Cross-referenced spot-checks against [wiki.leagueoflegends.com](https://wiki.leagueoflegends.com/en-us/) confirmed matching values. `leagueoflegends.fandom.com` (the old Fandom-hosted wiki) was explicitly excluded as a source per your instruction not to trust it.

**Ability haste mechanic/formula:**
Confirmed via [wiki.leagueoflegends.com/en-us/Haste](https://wiki.leagueoflegends.com/en-us/Haste) and corroborated independently elsewhere — no cap, linear diminishing effective reduction as haste increases.

**Summoner spell base cooldowns:**
Each spell's current cooldown was verified against its own page on [wiki.leagueoflegends.com](https://wiki.leagueoflegends.com/en-us/), cross-checked against Leaguepedia and other current sources:
- [Flash](https://wiki.leagueoflegends.com/en-us/Flash): 300s
- [Teleport](https://wiki.leagueoflegends.com/en-us/Teleport): 300s (flat base; the calculator does not model the level-scaling "Unleashed Teleport" range/cooldown variant that unlocks a few minutes into a match)
- [Heal](https://wiki.leagueoflegends.com/en-us/Heal): 240s
- [Cleanse](https://wiki.leagueoflegends.com/en-us/Cleanse): 240s (recently increased from 210s — the wiki's own infobox and patch history both confirm 240s is current)
- [Exhaust](https://wiki.leagueoflegends.com/en-us/Exhaust): 240s
- [Ghost](https://wiki.leagueoflegends.com/en-us/Ghost): 240s
- [Barrier](https://wiki.leagueoflegends.com/en-us/Barrier): 180s
- [Ignite](https://wiki.leagueoflegends.com/en-us/Ignite): 180s
- [Smite](https://wiki.leagueoflegends.com/en-us/Smite): shown as 90s, its steady-state recharge time. Smite actually uses a 2-charge system (starts with 1 charge, gains a second at 1:20 into the match, then one charge every 90s) rather than a single flat cooldown — the 90s figure is a simplification, not the literal first-use cooldown.
- Clarity and other Howling Abyss/ARAM-exclusive spells were excluded — out of scope for tracking cooldowns in a live Summoner's Rift game, the stated use case for this feature.

**Summoner spell haste sources (Lucid Boots / Cosmic Insight):**
- [Ionian Boots of Lucidity](https://wiki.leagueoflegends.com/en-us/Ionian_Boots_of_Lucidity): +10 ability haste, +45 move speed, and a passive granting +10 summoner spell haste. Only the summoner spell haste portion is modeled by this checkbox.
- Cosmic Insight (rune): +18 summoner spell haste, confirmed against [vpesports.com](https://vpesports.com/lol/runes/cosmic-insight/) (explicitly cites Data Dragon 16.16.1, matching this tool's champion-data patch) and corroborated by [leagueofitems.com](https://leagueofitems.com/runes/8347).

**Skill order (which of Q/W/E a champion maxes first/second/third):**
This isn't in Data Dragon — it's playstyle convention, not a game rule — so it was estimated from current aggregate play data:
1. Primary source: [u.gg](https://u.gg/) build pages, one per champion (173/173 fetched successfully).
2. Cross-checked against [Mobalytics](https://mobalytics.gg/) for all 173.
3. Where u.gg and Mobalytics disagreed (17 champions), resolved by majority vote against a third source, [op.gg](https://op.gg/), plus targeted research for the two hardest cases: Locke (a brand-new champion, so early aggregate data was thin) and Shyvana (contested even across guides post-rework).
4. You verified all 17 low-confidence cases against [lolalytics](https://lolalytics.com/) directly. Your corrections were applied: Aurelion Sol, Shaco, Udyr, and Urgot's orders changed from the majority-vote estimate to your lolalytics-confirmed order; the other 13 already matched.
5. All 156 remaining champions had unanimous agreement across u.gg, Mobalytics, and op.gg — no ambiguity to resolve.
6. Any mismatch between the tool's estimate and your actual build is fixable per-ability via the manual rank override dropdowns — the estimate is a convenience default, not a hard constraint.

**Summoner spells**
- Sits directly under the main Cooldowns box, independent of champion selection — works with no champion picked.
- Two dropdowns ("Summoner Spell 1" / "Summoner Spell 2", defaulting to Flash and Heal) covering all 9 non-ARAM-exclusive summoner spells: Flash, Teleport, Heal, Cleanse, Exhaust, Ghost, Barrier, Ignite, Smite.
- Two checkboxes for the two things that grant **summoner spell haste** (a separate stat from ability haste, but reduced by the same formula):
  - **Lucid Boots** (Ionian Boots of Lucidity): +10 summoner spell haste.
  - **Cosmic Insight** (rune): +18 summoner spell haste.
  - Both stack additively if checked together (28 total).
- Results table shows base CD and effective CD for both selected spells, updating live on any dropdown/checkbox change.

**Summoner spell haste formula**
- Same shape as ability haste: `Effective CD = Base CD ÷ (1 + Summoner Spell Haste ÷ 100)`. Summoner spell haste is a distinct stat from ability haste in the current game — it only affects summoner spells and summoner-spell-haste items/runes, so the two haste boxes on this page never interact.

**Cooldown tracker icons (mid-game overlay replacement)**
- Every ability (Q/W/E/R) and both summoner spell slots have a small square icon in a "Track" column.
- Click an icon the moment you see the enemy use that ability/spell, and it starts counting down from the currently-displayed effective CD — the icon darkens and shows the remaining seconds live, similar to old-school overlay trackers (Porofessor/u.gg live client).
- Click the same icon again while it's counting down to reset it back to ready — useful if you misclicked or want to clear it manually.
- Timers finish on their own and return to the ready state automatically.
- Switching champions clears all 4 ability trackers (they belong to the previous champion's kit and no longer apply). Summoner spell trackers persist across champion switches, since spells aren't champion-specific. Changing either summoner spell dropdown resets that slot's tracker, since it's now a different spell.
- Changing Level/Ability Haste/spell-haste checkboxes while a timer is running does not retroactively change that timer — it reflects the effective CD at the moment you clicked, matching how a real cast's cooldown doesn't change after the fact.

**Collapsible sections**
- Click any section's title bar (the dark bar with a `[-]`/`[+]` indicator) to collapse it down to just the title, or expand it again. Useful for hiding modules you don't need on screen, e.g. Summoner Spells or the Notes section, while using this as a compact overlay next to your game.

**Voice alerts ("Ignite off cooldown", "Ultimate off cooldown", etc.)**
- Every Track icon (all 4 abilities and both summoner spell slots) has a small "Alert" checkbox underneath it.
- Check it, and when that timer finishes, the page speaks a phrase out loud using your browser's built-in text-to-speech engine (the Web Speech API's `SpeechSynthesis` interface) — no server, no API key, and no internet connection required, since it uses whatever TTS voice is already installed on your OS/browser.
- Phrasing: Q/W/E use the ability's real name (e.g. "Charm off cooldown" for Ahri's E), R always says "Ultimate off cooldown" regardless of champion (since that's the callout that matters most, mid-fight, without having to know every champion's R name), and summoner spells use their real name (e.g. "Ignite off cooldown", "Flash off cooldown").
- "Test Alert Voice" in the top nav bar plays a sample phrase immediately, so you can confirm your system's TTS works before relying on it mid-game.
- If your browser has no speech synthesis support at all, it silently falls back to a short beep tone instead of doing nothing.
- Alert checkboxes are independent of the tracker itself — checking "Alert" doesn't start a timer, it just decides whether a *future* timer for that slot announces itself when it finishes. Your checked/unchecked choices persist across champion switches and re-renders (level/haste changes), so you can, e.g., always leave "R" and "Flash" checked and forget about it.
- Why not different distinct chime sounds instead of speech? A single set of ability-specific spoken names scales to all 173 champions x 4 abilities without needing 692 unique sound files, and it's the same self-describing approach real casters/coaches use ("his flash is up") rather than needing to memorize which beep pitch means which ability.

## Phone / mobile use

The desktop layout is unchanged. Everything below only activates on small screens (under 820px wide) or touch devices, so nothing about the PC experience is affected.

**Layout**
- All multi-column layouts collapse into a single full-width stack: Select Champion, then Cooldowns, then Summoner Spells, then Champion Stats, then the reference sections.
- The page goes edge-to-edge (no wasted outer border/margin) and respects notches and rounded corners via `env(safe-area-inset-*)`.
- The champion list shrinks to a short scroll box (~168px) with finger-sized rows, so it doesn't push the actual numbers off-screen.
- The redundant "Key"/"Slot" first column is hidden — the Track icon is already labelled Q/W/E/R and FL/TP/etc — which frees the width needed to fit the remaining columns without horizontal scrolling.
- "Ability Haste Formula" and "Notes on Rank Estimation" start collapsed on phones (they're static reference text), so the live parts of the tool are all reachable without a long scroll. Tap either title bar to expand. Desktop still opens with everything expanded.
- A separate landscape-phone breakpoint shrinks the banner, which would otherwise eat most of a short screen.
- A narrow-phone breakpoint (≤380px) tightens padding further.

**Touch handling**
- Track icons grow from 34px to 46px, and Alert checkboxes to 20px, for reliable thumb taps.
- `touch-action: manipulation` removes the ~300ms tap delay and double-tap-to-zoom on all interactive controls, so taps register instantly.
- The blue tap-highlight flash is removed via `-webkit-tap-highlight-color: transparent`.
- All `:hover` styling is wrapped in `@media (hover: hover)` so hover states don't get "stuck" on after a tap, which is the usual giveaway that a site was built desktop-only.
- Text inputs and selects are set to 16px on mobile, which is the threshold below which iOS Safari force-zooms the whole page when you focus a field.
- Tapping a champion blurs the search field (dismissing the on-screen keyboard) and smooth-scrolls to the cooldown table.
- Short haptic vibration on tracker tap, and a distinct triple-buzz pattern when a cooldown finishes (Android; iOS Safari doesn't expose the Vibration API).
- `overscroll-behavior-y: contain` prevents pull-to-refresh from firing while you're tapping near the top of the page.

**Installable / offline (PWA)**
- `manifest.json` plus a `<meta name="viewport">` tag and app icons make it installable to the home screen ("Add to Home Screen" on iOS, "Install app" on Android). Once installed it launches in standalone mode with no browser address bar, which is what makes it feel like a real app rather than a web page.
- `sw.js` is a service worker that caches the page so it keeps working with no connection. It's deliberately **network-first**: a live copy is always preferred and the cache is only a fallback, so pushing an update never leaves you stuck on a stale version.
- Screen wake lock: while any cooldown timer is actively running, the page asks the OS to keep the screen awake (`navigator.wakeLock`), so your phone doesn't sleep mid-game while you're using it as a tracker. The lock is released as soon as no timers are running, and re-acquired when you switch back to the tab.
- Voice alerts are "primed" on your first tap. Mobile browsers refuse to play speech that wasn't started by a user gesture, so without this the automatic off-cooldown announcements would be silently swallowed on a phone.

## Explicit exclusions (per your instructions)

- Passive abilities are not included, even for champions whose passive cooldown is affected by ability haste (e.g. Kled, Rakan, Vi). Only the 4 main abilities (Q/W/E/R) are calculated.
- `leagueoflegends.fandom.com` was never used as a data source at any stage.

## Known limitations

- Champion-specific stat scaling that isn't a flat per-rank cooldown array (e.g. abilities with cooldowns that also scale with a stat like bonus attack speed) is not modeled — the tool uses each ability's listed Data Dragon cooldown-per-rank values as-is.
- Skill order is an estimate of the *most common* leveling pattern, not a guarantee for every build (jungle vs. lane, AP vs. AD variants, etc. can differ) — use the manual override for off-meta builds.
- Data reflects patch 16.16.1; if Riot ships balance changes, the base cooldowns in `data.js` won't update automatically and would need to be regenerated from a newer Data Dragon snapshot.
