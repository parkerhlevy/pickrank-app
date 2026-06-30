import { theme } from "../lib/theme";

type AccuracyScoreProps = {
  label: string;
  value: string;
};

export const AccuracyScore = ({ label, value }: AccuracyScoreProps) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-start",
        padding: "24px 28px",
        borderRadius: 28,
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(34, 197, 94, 0.18))",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        style={{
          color: theme.colors.mutedText,
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: theme.colors.text,
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
    </div>
  );
};
