# Rolling Insights Meeting Notes

## Source and status

- Meeting: Rolling Wave / Rolling Insights DataFeeds
- Date: August 17, 2026
- Duration: 24 minutes
- Source: Parker's pasted Fathom meeting summary and [Fathom recording/transcript](https://fathom.video/share/zkhQzHy2_XzzdTED6CW35PAvZBi_kfCd)
- Evidence class: vendor-conversation notes supplied by Parker
- License status: not a signed quote or license. Do not treat these notes as production authorization.

The Fathom transcript auto-transcribes the post-game price as “42 for the year.” Parker confirmed that the intended base price is approximately `$4,200/year`, which matches the published post-game reference in the provider comparison. Use `$4,200/year` for cost analysis. Keep the transcript wording as a transcription discrepancy, not as a second price.

## Meeting purpose

Evaluate Rolling Insights DataFeeds for PickRank's free-to-play weekly NFL game. PickRank users rank 10 quarterbacks from a 20-quarterback pool. Scoring uses rank differential. The lowest score wins.

Parker described PickRank as a bootstrapped project being built during paternity leave. Rolling Insights described its Accelerator as a response to the high cost of sports-data feeds, based on the founders' experience building a consumer fantasy app. Parker found Rolling Insights through ChatGPT research. No trial token had been created before the meeting.

## Meeting facts and offer

- The core need is a reliable, affordable feed for official stats and result validation.
- The prior enterprise provider was rejected because the quoted price was about `$10k/season`.
- The Breakaway Accelerator was presented as an early-stage company program.
- The standard post-game feed was described as approximately `$4,200/year` before the Accelerator discount. The transcript renders this as “42 for the year,” which Parker corrected to `$4,200/year`.
- Accelerator discount schedule: 80% in year 1, 60% in year 2, and 30% in year 3.
- Nominal post-game costs if the stated base and discounts apply: about `$840` in year 1, `$1,680` in year 2, and `$2,940` in year 3.
- The program requires upfront annual payment. Billing converts to monthly after the first 12 months.
- The program expects active community participation through Discord and monthly speakers.
- The meeting described the offer as viable for an early-stage company, subject to testing and follow-up.
- Josh described live or in-game latency as roughly 20–40 seconds, sometimes longer, and said the feed also includes play-by-play, schedules, team and player stats, depth charts, and injuries.
- The 30-day trial does not include historical data. Paid access was described as including historical data back to approximately 2018, subject to the selected tier and written entitlement.

## Post-meeting account state

- Rolling Insights later sent a welcome email confirming that the free account trial had started and lasts 30 days. The email says tokens can be created during the trial and data can be tested without restrictions.
- The account screen now shows a generated 64-character RSC token for NFL Post Game. The token was read only in memory for a private probe. The guided probe succeeded with HTTP 200 responses for the season schedule, daily schedule, and live feed endpoints. The token was not printed or stored.

## Vendor rights update

- On August 20, 2026, Josh from Rolling Insights replied in the Rolling Insights Discord `#customer-care` channel to Parker's question about PickRank's server-side ranking, display, validation, and storage use case.
- Josh's reply was: “Absolutely! You can use our data for this use case. And there would be no changes once you start running pay-to-enter contests.”
- This is direct vendor-conversation evidence that the described free-to-play use and later pay-to-enter contests are accepted. Treat it as a material clarification, but not as a signed amendment to the Terms of Service or a complete answer on retention, caching, attribution, redistribution, rate limits, or third-party app authorization.
- Josh also shared an unreleased NFL play-by-play endpoint reference: [Rolling Insights NFL play-by-play documentation](https://docs.datafeeds.rolling-insights.com/#tag/Play-by-Play/paths/~1play-by-play~1NFL/get). The Discord message states that this documentation is not formally released yet. Do not treat it as stable public documentation until Rolling Insights publishes or confirms it.

## API documentation review

- The Rolling Insights documentation describes REST access for all supported sports and GraphQL access currently covering NFL and MLB. The token workflow asks for an API type, data-delivery tier, and sport.
- The NFL REST documentation exposes season, weekly, and daily schedule endpoints with game IDs, home and away team IDs, season type, and status values including `scheduled`, `inprogress`, `final`, and `completed`. Its examples include preseason games.
- The NFL box-score documentation includes player IDs, team IDs, quarterback position fields, `passing_yards`, and `passing_touchdowns`.
- The docs show the RSC token in the request query string and use an `http://` REST host in the examples. The private probe succeeded against the HTTPS REST host. Keep query-string handling inside the private server-side seam and do not expose the token to clients.
- The account screen supplied by Parker shows an NFL post-game trial configuration at `$350/month` after trial, and states that trial keys contain current-season data only and expire 30 days after creation. Treat the screen as account evidence, not a signed price or license.
- Rolling Insights' public marketing pages describe the trial as fully functional and advertise historical access, while the meeting notes and Parker's account screen say the trial is current-season only. Treat historical trial access as unresolved until the account behavior or vendor confirms it in writing.
- The documentation's setup and upgrade steps are vendor instructions. They do not authorize PickRank to submit a token request, upgrade an account, or accept commercial terms.

## Technical validation plan

- Create a free 30-day Rolling Insights trial token. Recommended nickname: `pickrank-nfl-preseason-2026-ro`. This is now complete in the account UI.
- Use REST, NFL only, and the narrowest post-game scope for the first token. Add live/real-time scope only after confirming that the trial cannot trigger a charge and that the extra scope is needed for the probe.
- Test NFL preseason data during the current preseason window.
- Test MLB as a second sport.
- Compare the trial output with the current MySportsFeeds test.
- Validate schedules, game state, player and game IDs, quarterback passing yards, final post-game values, correction behavior, latency, and response repeatability.
- Send Josh Hansen feedback and a cost comparison within about one week.

The parked probe accepts the project-specific token variable or Rolling's `RSC_TOKEN` alias. It keeps the token out of command-line arguments and reports network, authentication, cache, and provider-response classes without printing request URLs. It remains GET-only and does not persist provider data. Live requests now send the vendor-recommended no-cache headers and timestamp cache-buster.

## Private probe result

- On 2026-08-18, the trial token returned `provider_success` with HTTP 200 and JSON for all three GET checks: season schedule, daily schedule, and live feed.
- The 2026 season schedule returned 321 games, including 49 preseason games. Returned statuses included `completed` and `scheduled`.
- The 2026-08-14 daily schedule returned three preseason games. The live feed returned all three with `gameStatus: Final` and `status: completed`.
- The payload supplied stable-looking game IDs, team IDs, player IDs, season type, game status, and quarterback rows with `passingYards`, `passingTouchdowns`, and `passingAttempts`. Sixteen quarterback rows were returned across the three games.
- This confirms the narrow technical fields needed for private preseason validation. It does not confirm correction behavior, historical access, rate limits, production latency, or license rights.

## Open commercial and rights questions

The meeting summary did not answer these questions. The August 20 Discord reply materially narrows the uncertainty for PickRank's described use and future pay-to-enter contests, but it is not a signed amendment. Section 12 of the [Rolling Insights Terms of Service](https://rolling-insights.com/terms-of-services/) is favorable because it says DataFeeds outputs may be used for internal and commercial purposes. It still contains limits on third-party distribution and display, competitive use, and third-party application access. Preserve the vendor reply and get formal written confirmation before integration or persistence:

- Does the approximately `$4,200/year` post-game price cover NFL, MLB, or a selected sport only?
- Does the Accelerator price include the exact DataFeeds tier required for PickRank?
- Does the post-game feed include preseason, regular season, and postseason NFL games?
- May PickRank use the data for a public free-to-play beta?
- May PickRank display derived rankings, player names, passing yards, and game states to users?
- May PickRank store provider values, IDs, and audit snapshots?
- The vendor reply says there would be no change when PickRank starts pay-to-enter contests. Can Josh or the contract confirm that this statement is the applicable commercial authorization for PickRank?
- Does Section 12 authorize PickRank as a third-party application that calls DataFeeds from its backend?
- Does “use the DataFeeds data outputs for internal and commercial purposes” permit public display of derived rankings, player names, passing yards, game states, and other contest-result inputs?
- Is PickRank considered competitive with SportWise under the restriction on competitive products or services?
- What attribution, caching, retention, redistribution, or rate-limit rules apply?
- Does the 30-day token have the same fields and access as the paid post-game tier, apart from historical data?
- What is the renewal price after year 3, and what happens if community participation requirements are not met?

## Action items

- Parker: create the 30-day trial token if it has not already been created.
- Parker/Codex: run the next private read-only checks for correction behavior, repeatability, and any explicitly entitled sport such as MLB. No Supabase or provider data was written.
- Parker: compare Rolling Insights output and cost with MySportsFeeds.
- Parker: email Josh Hansen feedback and the decision or next question in about one week.
- Josh Hansen: follow up the next week if Parker has not provided an update.

## PickRank boundary

This note does not authorize production integration, public display, Supabase writes, provisional persistence, payment changes, scoring changes, or official typed-`FINAL` finalization changes.
