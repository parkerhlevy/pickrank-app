import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { entrance, rise, scaleIn } from "../lib/motion";
import { theme } from "../lib/theme";

type ScoringSceneProps = {
  player: string;
  pickedRank: number;
  actualRank: number;
  distance: number;
  scoreSummary: string;
  supportingLine: string;
  accentColor: string;
};

export const ScoringScene = ({
  player,
  pickedRank,
  actualRank,
  distance,
  scoreSummary,
  supportingLine,
  accentColor,
}: ScoringSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 20);
  const cards = entrance(Math.max(frame - 16, 0), 24);
  const distanceBar = Math.min(1, Math.max(0, (frame - 30) / 28));

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
          gap: 18,
          maxWidth: 520,
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
            letterSpacing: "-0.06em",
            lineHeight: 0.94,
          }}
        >
          Closer is
          <br />
          better.
        </div>
        <div style={{ color: theme.colors.mutedText, fontSize: 28, fontWeight: 600 }}>
          {supportingLine}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 8,
            opacity: cards,
          }}
        >
          <div style={{ color: theme.colors.text, fontSize: 22, fontWeight: 800 }}>
            Miss by 0 = perfect
          </div>
          <div
            style={{
              width: 300,
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${distanceBar * 72}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accentColor} 0%, rgba(255,255,255,0.85) 100%)`,
              }}
            />
          </div>
          <div style={{ color: theme.colors.mutedText, fontSize: 20, fontWeight: 700 }}>
            Bigger miss = tougher climb
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 220px)",
          gap: 18,
          transform: `scale(${scaleIn(cards)})`,
          opacity: cards,
        }}
      >
        <div style={cardStyle}>
          <div style={eyebrowStyle}>You picked</div>
          <div style={titleStyle}>{player}</div>
          <div style={numberStyle}>#{pickedRank}</div>
        </div>
        <div style={cardStyle}>
          <div style={eyebrowStyle}>Actual finish</div>
          <div style={titleStyle}>{player}</div>
          <div style={numberStyle}>#{actualRank}</div>
        </div>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(255,255,255,0.92))" }}>
          <div style={eyebrowStyle}>Result</div>
          <div style={titleStyle}>{scoreSummary}</div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <div style={{ color: accentColor, fontSize: 52, fontWeight: 900 }}>{distance}</div>
            <div style={{ color: "#334155", fontSize: 20, fontWeight: 800 }}>distance</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const cardStyle = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  justifyContent: "space-between",
  minHeight: 250,
  padding: "24px 24px 28px",
  borderRadius: 28,
  background: "rgba(255,255,255,0.94)",
  boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
};

const eyebrowStyle = {
  color: "#64748b",
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const titleStyle = {
  color: "#0f172a",
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
};

const numberStyle = {
  color: "#0f172a",
  fontSize: 68,
  fontWeight: 900,
  letterSpacing: "-0.06em",
};
