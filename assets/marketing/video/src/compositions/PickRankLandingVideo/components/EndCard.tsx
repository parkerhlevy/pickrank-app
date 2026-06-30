import { useCurrentFrame } from "remotion";
import { bob, pulse, shimmer } from "../lib/motion";
import { theme } from "../lib/theme";

type EndCardProps = {
  headline: string;
  lines: string[];
  ctaLabel: string;
  ctaUrlLabel: string;
};

export const EndCard = ({
  headline,
  lines,
  ctaLabel,
  ctaUrlLabel,
}: EndCardProps) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        padding: "56px 64px",
        borderRadius: 36,
        background: "rgba(9, 17, 31, 0.76)",
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadow.card,
        backdropFilter: "blur(18px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -120 + frame * 6,
          width: 180,
          height: 480,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0) 100%)",
          transform: "rotate(24deg)",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          color: theme.colors.text,
          fontSize: 92,
          fontWeight: 900,
          letterSpacing: "-0.06em",
          transform: `translateY(${bob(frame, 3, 18)}px)`,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {lines.map((line) => (
          <div
            key={line}
            style={{
              color: theme.colors.mutedText,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "18px 28px",
          borderRadius: theme.radius.pill,
          background: theme.colors.accent,
          color: "#ffffff",
          fontSize: 28,
          fontWeight: 800,
          boxShadow: `0 16px 30px rgba(37, 99, 235, ${shimmer(frame, 0.24, 0.4, 14)})`,
          transform: `scale(${pulse(frame, 0.985, 1.02, 20)})`,
        }}
      >
        {ctaLabel}
      </div>
      <div
        style={{
          color: theme.colors.fadedText,
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        {ctaUrlLabel}
      </div>
    </div>
  );
};
