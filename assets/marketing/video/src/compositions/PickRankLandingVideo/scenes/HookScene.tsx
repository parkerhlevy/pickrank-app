import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticHeadline } from "../components/KineticHeadline";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { SlateCard } from "../components/SlateCard";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { bob, entrance, popIn, rise, shimmer } from "../lib/motion";
import { theme } from "../lib/theme";

type HookSceneProps = {
  eyebrow: string;
  lines: string[];
  supportLine: string;
  cards: Array<{title: string; value: string}>;
  accentColor: string;
};

export const HookScene = ({ eyebrow, lines, supportLine, cards, accentColor }: HookSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 18);
  const cardsProgress = entrance(Math.max(frame - 12, 0), 20);

  return (
    <AbsoluteFill
      style={{
        padding: "96px 104px",
        justifyContent: "space-between",
      }}
    >
      <SceneBackdrop accentColor={accentColor} mode="top-left" />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 1120,
          opacity: intro,
          transform: `translateY(${rise(intro, 30)}px)`,
        }}
      >
        <SectionEyebrow label={eyebrow} />
        <KineticHeadline
          lines={lines}
          accentColor={accentColor}
          accentLineIndices={[3]}
          fontSize={82}
          gap={4}
          maxWidth={1180}
        />
        <div
          style={{
            color: theme.colors.mutedText,
            fontSize: 28,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            opacity: shimmer(frame, 0.74, 1, 24),
          }}
        >
          {supportLine}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          opacity: cardsProgress,
        }}
      >
        {cards.map(({ title, value }, index) => {
          const progress = entrance(Math.max(frame - 18 - index * 6, 0), 18);
          return (
            <div
              key={title}
              style={{
                transform: `translateY(${rise(progress, 42) + bob(frame + index * 10, 4, 20)}px) scale(${popIn(progress, 0.9, 1.03)})`,
                opacity: progress,
              }}
            >
              <SlateCard title={title} value={value} tone="dark" />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          right: 104,
          top: 104,
          padding: "10px 16px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "0.04em",
          opacity: shimmer(frame, 0.72, 1, 18),
          transform: `translateY(${bob(frame, 5, 16)}px)`,
        }}
      >
        pickrankgames.com
      </div>
    </AbsoluteFill>
  );
};
