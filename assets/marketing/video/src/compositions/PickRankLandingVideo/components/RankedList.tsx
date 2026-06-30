import { theme } from "../lib/theme";

type RankedListProps = {
  title: string;
  items: string[];
  accentColor: string;
};

export const RankedList = ({ title, items, accentColor }: RankedListProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 24,
        borderRadius: 28,
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div
        style={{
          color: "#374151",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      {items.map((item, index) => (
        <div
          key={`${title}-${item}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 16px",
            borderRadius: 20,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background: index < 3 ? "rgba(37, 99, 235, 0.08)" : "rgba(248, 250, 252, 0.98)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.pill,
              background: accentColor,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {index + 1}
          </div>
          <div
            style={{
              color: "#0f172a",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {item}
          </div>
        </div>
      ))}
    </div>
  );
};
