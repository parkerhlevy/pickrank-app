import { theme } from "../lib/theme";

type SlateCardProps = {
  title: string;
  value: string;
  tone?: "light" | "dark";
};

export const SlateCard = ({
  title,
  value,
  tone = "light",
}: SlateCardProps) => {
  const light = tone === "light";
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "22px 24px",
        borderRadius: 24,
        background: light ? "rgba(255, 255, 255, 0.92)" : "rgba(16, 24, 40, 0.82)",
        border: light
          ? "1px solid rgba(15, 23, 42, 0.08)"
          : `1px solid ${theme.colors.border}`,
        boxShadow: light ? "0 16px 36px rgba(15, 23, 42, 0.10)" : theme.shadow.card,
      }}
    >
      <div
        style={{
          color: light ? "#4b5563" : theme.colors.mutedText,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: light ? theme.colors.background : theme.colors.text,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
    </div>
  );
};
