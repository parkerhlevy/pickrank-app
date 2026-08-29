# Education and Trust Design QA

## Evidence

- Source visual truth: `/Users/parkerlevy/.codex/generated_images/01a02fde-03c9-7e50-ae9d-b259b1ad4b1b/exec-63930aed-c2ce-4bbe-aa54-96dfaa075702.png`
- Source dimensions: `1487 x 1058` pixels. The review board contains three unframed mobile web concepts.
- Implementation route targets: `/how-it-works?returnTo=%2Fcontests%2Fweek-1-qb-passing-yards` and signed-in incomplete `/profile`.
- Intended implementation viewport: `390 x 844` CSS pixels at device scale factor `1`.
- Implementation screenshot: unavailable.
- State: How It Works reached from Contest details, plus the signed-in incomplete Profile eligibility form.

## Findings

- [P1] Browser-rendered comparison is unavailable.
  - Location: local PickRank preview.
  - Evidence: both direct Next.js startup and the approved Portless path were denied local loopback binding or access by the Codex desktop macOS sandbox. No browser-rendered implementation screenshot could be captured.
  - Impact: typography, spacing, wrapping, responsive layout, tokens, and copy placement cannot receive the required visual comparison against the selected mock-up.
  - Fix: run the focused desktop and mobile browser suite in the hosted Linux Chromium gate after an approved commit and push. Capture the two route states at `390 x 844`, compare them with the selected mock-up, and correct any P0, P1, or P2 differences before merge.

## Required Fidelity Surfaces

- Fonts and typography: blocked pending a browser-rendered capture.
- Spacing and layout rhythm: blocked pending a browser-rendered capture.
- Colors and visual tokens: implementation uses existing PickRank tokens, but visible comparison is blocked.
- Image quality and asset fidelity: no image asset from the mock-up was implemented. The mock-up's invented logo was intentionally rejected. Existing PickRank branding remains unchanged.
- Copy and content: source review confirms the compact `2nd -> 5th -> +3 points` example, state-purpose helper, and contextual return copy are implemented. The existing detailed player example and tiebreaker content remain unchanged. Visible wrapping remains unverified.

## Comparison History

- No visual comparison iteration was possible because the implementation screenshot could not be captured.

## Implementation Checklist

- Run the hosted Linux Chromium gate after an approved push.
- Capture How It Works from Contest details at desktop and `390 x 844` mobile sizes.
- Capture the signed-in incomplete Profile state at desktop and `390 x 844` mobile sizes.
- Compare each implementation capture with the selected visual target.
- Fix any P0, P1, or P2 issues before merge.

## Follow-up Polish

- None recorded without visible implementation evidence.

final result: blocked
