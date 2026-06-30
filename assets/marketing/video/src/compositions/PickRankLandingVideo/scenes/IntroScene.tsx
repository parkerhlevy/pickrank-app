import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticHeadline } from "../components/KineticHeadline";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { SlateCard } from "../components/SlateCard";
import { bob, entrance, popIn, slideX } from "../lib/motion";
import { theme } from "../lib/theme";

type IntroSceneProps = {
  headline: string;
  subhead: string;
  featureCards: string[];
};

export const IntroScene = ({
  headline,
  subhead,
  featureCards,
}: IntroSceneProps) => {
  const frame = useCurrentFrame();
  const headlineProgress = entrance(frame, 18);
  const cardsProgress = entrance(Math.max(frame - 10, 0), 20);

  return (
    <AbsoluteFill
      style={{
        padding: "110px 112px",
        justifyContent: "center",
      }}
    >
      <SceneBackdrop accentColor={theme.colors.accent} mode="top-right" />
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 36,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <SectionEyebrow label="How it plays" />
          <KineticHeadline
            lines={[headline]}
            accentColor={theme.colors.accent}
            fontSize={96}
            gap={0}
            maxWidth={760}
          />
          <div
            style={{
              color: theme.colors.mutedText,
              fontSize: 34,
              fontWeight: 600,
              maxWidth: 760,
              opacity: headlineProgress,
              lineHeight: 1.26,
              transform: `translateY(${bob(frame, 2, 22)}px)`,
            }}
          >
          {subhead}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 18,
            opacity: cardsProgress,
            transform: `translateX(${slideX(1 - cardsProgress, -40)}px)`,
          }}
          >
          {featureCards.map((card, index) => {
            const progress = entrance(Math.max(frame - 14 - index * 6, 0), 16);
            return (
              <div
                key={card}
                style={{
                  opacity: progress,
                  transform: `translateX(${slideX(1 - progress, -40)}px) translateY(${bob(frame + index * 5, 4, 20)}px) scale(${popIn(progress, 0.92, 1.02)})`,
                }}
              >
                <SlateCard
                  title={index === 0 ? "1" : index === 1 ? "2" : "3"}
                  value={card}
                  tone="dark"
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
