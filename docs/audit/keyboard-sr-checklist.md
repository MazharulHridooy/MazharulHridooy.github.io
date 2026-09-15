# Keyboard and screen-reader pass

Verified 2026-09-15 against `http://localhost:4174/` (gzip server), Chrome 141,
viewports 800×600 and 1280×900. Structural assertions were read out of the live
DOM rather than eyeballed — the method for each is in the right-hand column.

## Keyboard

| # | Check | Result | How it was verified |
|---|---|---|---|
| 1 | Skip link is the first focusable element | **PASS** | Focusable list built from `a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])`; index 0 is `a.skip-link` |
| 2 | Skip link target exists | **PASS** | `href="#main"` → `main#main` present |
| 3 | Skip link visible only on focus | **PASS** | `left:-9999px`, `.skip-link:focus{left:0}` |
| 4 | Tab order follows visual order | **PASS** | First six: skip link → brand → Focus → Experience → Skills → Education |
| 5 | No positive tabindex (no tab-order hijacking) | **PASS** | `[tabindex]` with value > 0: **0 elements** |
| 6 | Total focusable elements | 19 | counted from the live DOM |
| 7 | Radar blips are keyboard reachable | **PASS** | 5 `.blip` elements, each `tabindex="0"` |
| 8 | Blip focus reveals its skill tag (not hover-only) | **PASS** | On focus, `.blip:focus-within` matches and computed `opacity` on `.skill-tags` goes `0 → 1` |
| 9 | Focus indicator is visible | **PASS** | `:focus-visible{outline:2px solid var(--teal); outline-offset:3px}` — global, not removed anywhere |
| 10 | Mobile menu button exposes state | **PASS** | `#navBurger` has `aria-expanded="false"` at rest, `aria-controls="navLinks"`, `aria-label="Toggle menu"` |
| 11 | Menu button has explicit type | **PASS** | `type="button"` — added after html-validate flagged the implicit default |

**Note on check 8.** An earlier reading of this returned opacity `0` and looked
like a real defect. It was measured at an 800px viewport where
`.radar-wrap{display:none}`, and again immediately after a viewport change
before relayout settled. Re-measured at 1280px with a settle delay it passes:
`blipMatchesFocusWithin: true`, computed opacity `1`. Recording the false
positive because the first number was wrong, not the page.

**Note on the mobile radar.** Below the radar breakpoint the skill tags are
shown unconditionally (`.skill-tags{opacity:1;pointer-events:auto}` inside the
mobile media query) because there is no hover or focus affordance on touch. That
is deliberate, and it is why a bare `.skill-tags` opacity rule appears in the
minified CSS.

## Screen reader / semantics

| # | Check | Result | How it was verified |
|---|---|---|---|
| 12 | Exactly one `h1` | **PASS** | `document.querySelectorAll('h1').length === 1` |
| 13 | No skipped heading levels | **PASS** | `H1,H2,H3,H3,H3,H3,H2,H2,H2,H2,H3` — was `H1,H2,H4,…` before the fix |
| 14 | Landmarks present | **PASS** | `nav`, `main#main`, `footer`; `main` was absent before |
| 15 | Document language declared | **PASS** | `<html lang="en">` |
| 16 | All images have alt text | **PASS** | images missing `alt`: **0** (the page ships 0 `<img>`; the favicon is a data-URI SVG) |
| 17 | SVG diagram is described | **PASS** | `case-study.html` architecture SVG has `role="img"` and `aria-labelledby` pointing at its own `<title>` + `<desc>` |
| 18 | Colour is not the only carrier of meaning | **PASS** | Fraud bands are labelled in text (`0–30 green`, `31–60 yellow`, `61–100 red`), not colour alone |
| 19 | Contrast ≥ 4.5:1 throughout | **PASS** | Lighthouse `color-contrast` audit: 0 failing nodes on both pages (21 failing before) |
| 20 | axe-core automated sweep | **PASS** | 0 violations on both pages — 26 passes on index, 41 on case-study |

## What this does not cover

axe and Lighthouse together catch roughly 20–50% of accessibility issues. The
following need a human with an actual screen reader and are **not** claimed here:

- VoiceOver / NVDA reading order and announcement quality
- Whether the live shift console's updating clock is appropriately silent
  (it has no `aria-live`, which is likely correct — it would otherwise interrupt
  continuously — but that is a judgement call nobody has confirmed with a real SR)
- Whether the radar metaphor is comprehensible non-visually at all; the blips
  are reachable and labelled, but "radar" as an information design may simply
  not translate

## Reproduce

```bash
python3 tools/serve-gzip.py 4174
npx @axe-core/cli http://localhost:4174/ http://localhost:4174/case-study.html --exit
lighthouse http://localhost:4174/ --only-categories=accessibility \
  --chrome-flags="--headless=new --no-sandbox" --output=html \
  --output-path=./docs/audit/lh-mobile-index
```
