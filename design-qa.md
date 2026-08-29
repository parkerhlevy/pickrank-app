# Education and Trust Design QA

## Evidence

- Source visual truth: `/Users/parkerlevy/.codex/generated_images/01a02fde-03c9-7e50-ae9d-b259b1ad4b1b/exec-63930aed-c2ce-4bbe-aa54-96dfaa075702.png`
- Source dimensions: `1487 x 1058` pixels. The review board contains three unframed mobile web concepts.
- Browser-rendered implementation screenshots: `.codex-preview/how-it-works-desktop.png` and `.codex-preview/how-it-works-mobile.png`.
- Desktop viewport: `1280 x 900` CSS pixels at density `1`; full-page capture is `1280 x 2186` pixels.
- Mobile viewport: `390 x 844` CSS pixels at density `1`; full-page capture is `390 x 2840` pixels.
- State: How It Works reached from Contest details with a contextual return target. GitHub Actions run `33240144907` passed the signed-in incomplete Profile state at desktop and mobile sizes.

## Findings

- No actionable P0, P1, or P2 differences remain.
- The selected source and both browser-rendered screenshots were inspected together. The implementation preserves the existing PickRank shell, typography, colors, cards, icons, and navigation.
- Intentional deviations are the rejected mock-up logo and inaccurate placeholder scoring. The implementation keeps the real PickRank brand and unchanged scoring content.

## Required Fidelity Surfaces

- Fonts and typography: passed. Existing PickRank font families, hierarchy, weights, line heights, and responsive wrapping remain consistent.
- Spacing and layout rhythm: passed. The scoring cells fit the existing desktop grid and mobile stack without horizontal overflow or clipped content.
- Colors and visual tokens: passed. The implementation uses the existing primary blue, slate borders, muted text, and card surfaces.
- Image quality and asset fidelity: passed. No raster asset is required. Existing Lucide icons remain consistent with the app, and the rejected mock-up logo was not implemented.
- Copy and content: passed. Approved summary and Profile helper copy are exact. Existing scoring mechanics, example rows, and tiebreakers are unchanged.
- Accessibility: passed. The scoring sequence has a concise accessible label, decorative parts are hidden, the Profile helper is associated through `aria-describedby`, and the return action uses the shared high-contrast back-link component.

## Comparison History

- Initial local capture was blocked because the Codex macOS shell could not bind the Next.js server.
- The Vercel preview rendered through Parker's existing authenticated Chrome profile.
- Desktop and mobile captures confirmed the approved scoring and return treatment with no overflow or app console errors. Chrome reported warnings from an unrelated installed extension only.
- Hosted Linux Chromium run `33240144907` passed in `4m 12s` and confirmed the incomplete Profile helper plus the complete browser regression suite.

## Implementation Checklist

- Contextual return link is visible and preserves the originating route.
- Compact scoring example is visible at first scoring contact.
- Existing detailed scoring and tiebreaker content remains unchanged.
- Profile state helper is visible and programmatically associated with the selector.
- Hosted desktop and mobile browser checks pass.

## Follow-up Polish

- None required for this release.

final result: passed
