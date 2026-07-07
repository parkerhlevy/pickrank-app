import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import type { PickRankLaunchVideoProps } from "./schema";
import { theme } from "./lib/theme";
import { CtaScene } from "./scenes/CtaScene";
import { DifferentiatorScene } from "./scenes/DifferentiatorScene";
import { HookScene } from "./scenes/HookScene";
import { IntroScene } from "./scenes/IntroScene";
import { NationalScene } from "./scenes/NationalScene";
import { RankingScene } from "./scenes/RankingScene";
import { ScoringScene } from "./scenes/ScoringScene";
import { SelectionScene } from "./scenes/SelectionScene";
import { pickRankTimeline } from "./timeline";

export const PICKRANK_LANDING_VIDEO_DURATION = pickRankTimeline.totalDuration;

export const PickRankLandingVideo = (props: PickRankLaunchVideoProps) => {
  const audioBedFile = props.audio?.bedFile ?? "audio/locked-in-final.wav";
  const audioTrimBeforeFrames = props.audio?.trimBeforeFrames ?? 0;

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <Audio
        src={staticFile(audioBedFile)}
        trimBefore={audioTrimBeforeFrames}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 24, PICKRANK_LANDING_VIDEO_DURATION - 45, PICKRANK_LANDING_VIDEO_DURATION - 1],
            [0, 0.16, 0.16, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
        }
      />
      <Sequence
        from={pickRankTimeline.hook.from}
        durationInFrames={pickRankTimeline.hook.duration}
        premountFor={30}
      >
        <HookScene
          lines={props.scenes.hook.lines}
          accentColor={props.brand.accentColor}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.intro.from}
        durationInFrames={pickRankTimeline.intro.duration}
        premountFor={30}
      >
        <IntroScene
          headline={props.scenes.intro.headline}
          subhead={props.scenes.intro.subhead}
          featureCards={props.scenes.intro.featureCards}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.selection.from}
        durationInFrames={pickRankTimeline.selection.duration}
        premountFor={30}
      >
        <SelectionScene
          statCategory={props.scenes.selection.statCategory}
          allPlayers={props.scenes.selection.allPlayers}
          selectedPlayers={props.scenes.selection.selectedPlayers}
          accentColor={props.brand.accentColor}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.ranking.from}
        durationInFrames={pickRankTimeline.ranking.duration}
        premountFor={30}
      >
        <RankingScene
          rankedPlayers={props.scenes.ranking.rankedPlayers}
          draggedPlayer={props.scenes.ranking.draggedPlayer}
          draggedFrom={props.scenes.ranking.draggedFrom}
          draggedTo={props.scenes.ranking.draggedTo}
          accentColor={props.brand.accentColor}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.scoring.from}
        durationInFrames={pickRankTimeline.scoring.duration}
        premountFor={30}
      >
        <ScoringScene
          headline={props.scenes.scoring.headline}
          supportingLine={props.scenes.scoring.supportingLine}
          examples={props.scenes.scoring.examples}
          totalPoints={props.scenes.scoring.totalPoints}
          accentColor={props.brand.accentColor}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.differentiator.from}
        durationInFrames={pickRankTimeline.differentiator.duration}
        premountFor={30}
      >
        <DifferentiatorScene
          headline={props.scenes.differentiator.headline}
          lines={props.scenes.differentiator.lines}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.national.from}
        durationInFrames={pickRankTimeline.national.duration}
        premountFor={30}
      >
        <NationalScene
          headline={props.scenes.national.headline}
          supportingLine={props.scenes.national.supportingLine}
          leaderboardRows={props.scenes.national.leaderboardRows}
          highlightedUser={props.scenes.national.highlightedUser}
        />
      </Sequence>
      <Sequence
        from={pickRankTimeline.cta.from}
        durationInFrames={pickRankTimeline.cta.duration}
        premountFor={30}
      >
        <CtaScene
          headline={props.scenes.cta.headline}
          supportingLines={props.scenes.cta.supportingLines}
          ctaLabel={props.scenes.cta.ctaLabel}
          ctaUrlLabel={props.scenes.cta.ctaUrlLabel}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
