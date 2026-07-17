---
name: html-to-image off-screen capture
description: Why capturing a fixed/-left-off-screen element with html-to-image yields a blank/black canvas, and the wrapper fix.
---

Rule: never put `position: fixed; left: -10000px` (or similar off-screen positioning) on the element passed to html-to-image's `toCanvas`. The clone keeps those styles, so the content renders outside the capture viewport and the canvas comes back blank (appears black in dark mode after background fill).

**Why:** The marketing investor-summary PDF exported as a solid black rectangle because the hidden capture section itself carried `fixed -left-[10000px]`.

**How to apply:** Use two nested divs — an outer wrapper with the off-screen fixed positioning, and an inner statically-positioned div (the one with the capture id) holding width/background/content. Capture the inner div only.
