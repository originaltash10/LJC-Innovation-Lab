# Mobile mode — changes to commit (scroll v2)

Files: `scroll2.css`, `scroll2.js`, `diagrams2.js`. No change to `index.html`, `ljc-lab.css`,
`stair-viewer.js`, `ask-reveal.js` or `wave-wall-reveal.js`. Desktop (>1100px) behaviour is
unchanged apart from the shorter 06/08 holds (`#c6.hold,#c8.hold{padding-bottom:40vh}`).

## What the page now does under 1100px
- Cover: pinned (300vh track). Text, then the layered wall centred beneath it; scrolling un-prints
  the layers and the render washes in full-bleed with the scan line. Hot layer = print head on
  touch (no pointer). Canvas capped at 2x. Under 640px the meta grid is hidden so title + wall fit.
- Process: unpinned; each step slides in from the right as it enters, current one blue, reversible.
- Curtain cover (v0): 280vh track, opens over the first 60%, zooms, eases to white over the last 26%;
  title stays until p2 > .42. Location cover (v1): 220vh track, plan draws full-width in the upper
  third, sites pulse. Covers 07/09 (v2/v3): 200vh track starting -100vh, slab rises over the pinned
  06/08 section. No scroll-snap (it fought touch); a post-scroll settle eases onto v0/v1 instead.
- Studies: title + text first, then a swipe strip (reference, ambient occlusion, render), each slide
  with its own tag (front-face images are wrapped at load when narrow).
- Location: steps A -> B -> C as the section passes; taps override until the next step.
- Compare: option chips sit above the slider.
- Fabricators: cards stick and settle (scale/veil) like desktop; galleries become swipe strips.
- Cost: name + total on one line, bar beneath; hover labels off on touch (`@media (hover:none)`).
- Close: pulsing "Tap" cue; tap forms the mark, tap again releases; cue returns after leaving view.
- Menu: single vertical column. Section heads get 124px top padding (clear of the HUD logo).

## Things learned the hard way (do not reintroduce)
- `overflow-x: clip` on `html`, `body` or the sections breaks / de-accelerates `position: sticky`
  (blank cover on Chromium, jitter on iOS). Sideways overflow is clipped at `#c1 .steps` instead.
- `scroll-snap-type` on the page causes jitter inside pinned tracks on iOS.
- The wall canvas must size its buffer from its own box (`cv.getBoundingClientRect()`), not its parent.
