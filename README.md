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

## Explicit exclusions (per your instructions)

- Passive abilities are not included, even for champions whose passive cooldown is affected by ability haste (e.g. Kled, Rakan, Vi). Only the 4 main abilities (Q/W/E/R) are calculated.
- `leagueoflegends.fandom.com` was never used as a data source at any stage.

## Known limitations

- Champion-specific stat scaling that isn't a flat per-rank cooldown array (e.g. abilities with cooldowns that also scale with a stat like bonus attack speed) is not modeled — the tool uses each ability's listed Data Dragon cooldown-per-rank values as-is.
- Skill order is an estimate of the *most common* leveling pattern, not a guarantee for every build (jungle vs. lane, AP vs. AD variants, etc. can differ) — use the manual override for off-meta builds.
- Data reflects patch 16.16.1; if Riot ships balance changes, the base cooldowns in `data.js` won't update automatically and would need to be regenerated from a newer Data Dragon snapshot.
