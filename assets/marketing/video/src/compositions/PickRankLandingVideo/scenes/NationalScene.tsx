import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticHeadline } from "../components/KineticHeadline";
import { LeaderboardCard } from "../components/LeaderboardCard";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { bob, entrance, popIn, rise } from "../lib/motion";
import { theme } from "../lib/theme";

type NationalSceneProps = {
  headline: string;
  supportingLine: string;
  leaderboardRows: Array<{name: string; region: string; valueLabel?: string}>;
  highlightedUser: string;
};

export const NationalScene = ({
  headline,
  supportingLine,
  leaderboardRows,
  highlightedUser,
}: NationalSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 20);
  const board = entrance(Math.max(frame - 14, 0), 24);

  return (
    <AbsoluteFill
      style={{
        padding: "72px 88px",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <SceneBackdrop accentColor={theme.colors.accent} mode="center" />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 520,
          opacity: intro,
          transform: `translateY(${rise(intro, 24)}px)`,
        }}
      >
        <SectionEyebrow label="Compete to win" />
        <KineticHeadline
          lines={[headline]}
          accentColor={theme.colors.accent}
          fontSize={86}
          gap={0}
          maxWidth={520}
        />
        <div
          style={{
            color: theme.colors.mutedText,
            fontSize: 28,
            fontWeight: 600,
            transform: `translateY(${bob(frame, 2, 20)}px)`,
          }}
        >
          {supportingLine}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: 760,
          transform: `translateY(${rise(board, 28) + bob(frame, 4, 22)}px) scale(${popIn(board, 0.92, 1.02)})`,
          opacity: board,
        }}
      >
        <LeaderboardCard rows={leaderboardRows} highlightedUser={highlightedUser} />
      </div>
    </AbsoluteFill>
  );
};
