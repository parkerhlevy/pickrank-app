import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { entrance, rise, scaleIn } from "../lib/motion";
import { theme } from "../lib/theme";

type ScoringSceneProps = {
  headline: string;
  supportingLine: string;
  examples: Array<{
    player: string;
    pickedRank: number;
    actualRank: number;
    points: number;
  }>;
  totalPoints: number;
  accentColor: string;
};

const getPointsColor = (points: number) => {
  if (points <= 1) {
    return "#22c55e";
  }

  if (points <= 3) {
    return "#f59e0b";
  }

  return "#ef4444";
};

export const ScoringScene = ({
  headline,
  supportingLine,
  examples,
  totalPoints,
  accentColor,
}: ScoringSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 20);
  const examplesProgress = entrance(Math.max(frame - 14, 0), 24);
  const totalProgress = entrance(Math.max(frame - 34, 0), 22);

  return (
    <AbsoluteFill
      style={{
        padding: "72px 88px",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <SceneBackdrop accentColor={accentColor} mode="bottom-left" />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 500,
          opacity: intro,
          transform: `translateY(${rise(intro, 24)}px)`,
        }}
      >
        <SectionEyebrow label="Step 3" />
        <div
          style={{
            color: theme.colors.text,
            fontSize: 82,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 0.94,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: theme.colors.mutedText,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.22,
            maxWidth: 420,
          }}
        >
          {supportingLine}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 14,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 292,
              minHeight: 78,
              padding: "14px 20px",
              borderRadius: 24,
              background: "rgba(34,197,94,0.16)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#86efac",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              fontSize: 19,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            Exact pick = 0 points
          </div>
          <div
            style={{
              width: 352,
              minHeight: 78,
              padding: "14px 20px",
              borderRadius: 24,
              background: "rgba(239,68,68,0.14)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              fontSize: 19,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            Bigger miss = more points
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: 720,
          opacity: examplesProgress,
          transform: `scale(${scaleIn(examplesProgress)})`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 18,
          }}
        >
          {examples.map((example, index) => {
            const pointsColor = getPointsColor(example.points);
            const progress = entrance(Math.max(frame - 18 - index * 8, 0), 18);

            return (
              <div
                key={example.player}
                style={{
                  ...exampleCardStyle,
                  opacity: progress,
                  transform: `translateY(${rise(progress, 24)}px) scale(${0.94 + progress * 0.06})`,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px",
                    gap: 16,
                    alignItems: "start",
                    minHeight: 96,
                  }}
                >
                  <div style={{ color: "#0f172a", fontSize: 34, fontWeight: 900, lineHeight: 0.92 }}>
                    {example.player}
                  </div>
                  <div
                    style={{
                      minHeight: 64,
                      padding: "8px 10px",
                      borderRadius: 18,
                      background: `${pointsColor}18`,
                      border: `1px solid ${pointsColor}40`,
                      color: pointsColor,
                      fontSize: 20,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {example.points} point{example.points === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={rankBlockStyle}>
                    <div style={rankLabelStyle}>Your rank</div>
                    <div style={rankValueStyle}>#{example.pickedRank}</div>
                  </div>
                  <div style={rankBlockStyle}>
                    <div style={rankLabelStyle}>Actual finish</div>
                    <div style={rankValueStyle}>#{example.actualRank}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            ...totalCardStyle,
            opacity: totalProgress,
            transform: `translateY(${rise(totalProgress, 24)}px) scale(${0.96 + totalProgress * 0.04})`,
          }}
        >
          <div style={{ color: "#0f172a", fontSize: 20, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Simple scoring math
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "nowrap" }}>
            {examples.map((example, index) => (
              <div
                key={`${example.player}-equation`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <div style={{ color: getPointsColor(example.points), fontSize: 46, fontWeight: 900 }}>
                    {example.points}
                  </div>
                  <div style={{ color: "#334155", fontSize: 20, fontWeight: 800, whiteSpace: "nowrap" }}>
                    for {example.player.split(" ")[1] ?? example.player}
                  </div>
                </div>
                {index < examples.length - 1 ? (
                  <div style={{ color: "#94a3b8", fontSize: 40, fontWeight: 700 }}>+</div>
                ) : null}
              </div>
            ))}
            <div style={{ color: "#94a3b8", fontSize: 40, fontWeight: 700, flexShrink: 0 }}>=</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(37,99,235,0.24))",
                flexShrink: 0,
              }}
            >
              <div style={{ color: accentColor, fontSize: 48, fontWeight: 900 }}>
                {totalPoints}
              </div>
              <div style={{ color: "#0f172a", fontSize: 20, fontWeight: 900, whiteSpace: "nowrap" }}>
                total points
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const exampleCardStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 18,
  minHeight: 224,
  padding: "24px 24px 26px",
  borderRadius: 28,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
};

const totalCardStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
  padding: "22px 24px 24px",
  borderRadius: 28,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
};

const rankBlockStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  padding: "14px 16px",
  minHeight: 116,
  justifyContent: "space-between" as const,
  borderRadius: 18,
  background: "#f8fafc",
  border: "1px solid rgba(15,23,42,0.08)",
};

const rankLabelStyle = {
  color: "#64748b",
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

const rankValueStyle = {
  color: "#0f172a",
  fontSize: 40,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};
