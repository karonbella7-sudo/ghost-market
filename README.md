# Ghost Market — Final-direction prototype

**本目录的新流程请以 [FINAL-NOTES.md](FINAL-NOTES.md) 为准。下面为继承的旧版说明，不代表当前层级和概率。**

Double-click `index.html` to open the offline demo. Keep the entire folder together.
No server, installation or network connection is required. Refresh resets the demo.

## Controls

- Hold W / S to move along the corridor.
- Move the mouse to look left/right (±90°) and up/down (±45°).
- Hold LEFT ALT to show the cursor and freeze mouse-look.
- ALT + click a nearby stall to inspect it. Drag products; × or Escape returns.
- From the second successful visit, ALT + click a nearby vendor to interact.
- From the third successful visit, select a vendor, then click an owned stroke in the white inventory bar. YES trades; NO keeps the stroke.

Strokes are randomly distributed across two or three stalls. A closed attempt (25% after the first open visit) does not advance the narrative.

## Implementation and checks

This is a separate copy of the existing prototype. Original `ghost-market` files were not modified.
`revision.js` corrects the missing scene-population calls, unstable inventory DOM and conflicting input modes. `asset-map.json` maps the packaged images to the supplied ZIP. The offline texture bundle contains 229 real user-provided images, optimized to 1200 px maximum.

`verify.cjs` runs application functions with real Three.js math and a simulated DOM; it covers five entries, all three vendor hitboxes, movement, persistent button identity, cancellation and vendor-specific exchange. It is not a browser screenshot or GPU rendering test.

Debug values in `revision.js` default to null/null/false. The demo has no visible debug controls.

## Background music

The two supplied MP3s are packaged in `audio/` for offline playback. After the ticket click, stage two loops `open-market.mp3` for an open market or `closed-market.mp3` for an empty corridor. Inspecting stalls and trading keep the current music playing. Leaving stage two fades it out and resets playback; the composition ending has no stage-two music. Existing interaction sounds remain enabled. `ambience.js` manages this independently of the visit and ending logic.
