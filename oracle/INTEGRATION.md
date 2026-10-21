# Ghost Market integration

This directory is a local copy of the supplied turtle-oracle website. The source website is unchanged.

The main website embeds this page only during divination. Its existing open/rest probability and pity rules select three consistent coin faces, passed through the local iframe fragment. market-bridge.js supplies these faces to the original animation. The original shell, poster, coin images, font and audio are preserved.

The result remains visible until ENTER THE MARKET is clicked. This replaces CAST AGAIN only in the embedded experience. The parent validates the sending frame and coin faces, then plays its existing crossing transition. The oracle audio stops and the iframe is removed on departure. Opening this oracle page independently still allows repeated casts.

Run the website from ../index.html. Keep this entire directory beside the main files for offline use. Logic and asset checks: verify-oracle.cjs and verify-final.cjs. These checks do not replace visual or listening checks in a real browser.
