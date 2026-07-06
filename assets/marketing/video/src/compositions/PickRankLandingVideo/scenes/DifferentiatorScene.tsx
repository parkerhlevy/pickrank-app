import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticHeadline } from "../components/KineticHeadline";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { bob, entrance, popIn, rise } from "../lib/motion";
import { theme } from "../lib/theme";

type DifferentiatorSceneProps = {
  headline: string;
  lines: string[];
};

export const DifferentiatorScene = ({
  headline,
  lines,
}: DifferentiatorSceneProps) => {
  const frame = useCurrentFrame();
  const progress = entrance(frame, 18);
  const cards = entrance(Math.max(frame - 10, 0), 20);

  return (
    <AbsoluteFill
      style={{
        padding: "72px 88px",
        justifyContent: "center",
      }}
    >
      <SceneBackdrop accentColor={theme.colors.accent} mode="center" />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: progress,
          transform: `translateY(${rise(progress, 28)}px)`,
        }}
      >
        <SectionEyebrow label="How it's unique" />
        <KineticHeadline
          lines={headline.split("|")}
          accentColor={theme.colors.accent}
          fontSize={84}
          gap={6}
          maxWidth={920}
          accentLineIndices={[2]}
        />
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
          marginTop: 40,
          opacity: cards,
        }}
      >
        {lines.map((line, index) => (
          <div
            key={line}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 160,
              padding: "24px 28px",
              borderRadius: 28,
              background:
                index === 1
                  ? "linear-gradient(180deg, rgba(37,99,235,0.22), rgba(37,99,235,0.10))"
                  : "rgba(255,255,255,0.06)",
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: 34,
              fontWeight: 900,
              textAlign: "center",
              lineHeight: 1.02,
              opacity: entrance(Math.max(frame - 12 - index * 6, 0), 16),
              transform: `translateY(${rise(entrance(Math.max(frame - 12 - index * 6, 0), 16), 30) + bob(frame + index * 5, 4, 22)}px) scale(${popIn(entrance(Math.max(frame - 12 - index * 6, 0), 16), 0.92, 1.025)})`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
