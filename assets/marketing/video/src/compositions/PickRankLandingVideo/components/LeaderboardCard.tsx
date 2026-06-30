import { useCurrentFrame } from "remotion";
import { bob, entrance, popIn, pulse, shimmer } from "../lib/motion";
import { theme } from "../lib/theme";

type LeaderboardRow = {
  name: string;
  region?: string;
  valueLabel?: string;
};

type LeaderboardCardProps = {
  rows: LeaderboardRow[];
  highlightedUser: string;
};

export const LeaderboardCard = ({
  rows,
  highlightedUser,
}: LeaderboardCardProps) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 28,
        borderRadius: 28,
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: theme.shadow.card,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(110deg, transparent 0%, transparent 44%, rgba(37,99,235,0.08) 50%, transparent 56%, transparent 100%)",
          transform: `translateX(${frame * 8 - 720}px)`,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
      <div
        style={{
          color: "#0f172a",
          fontSize: 30,
          fontWeight: 900,
        }}
      >
        Weekly Board
      </div>
        <div
          style={{
            padding: "8px 14px",
            borderRadius: theme.radius.pill,
            background: "rgba(37, 99, 235, 0.08)",
            color: theme.colors.accent,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          National Week
        </div>
      </div>
      {rows.map((row, index) => {
        const highlighted = row.name === highlightedUser;
        const progress = entrance(Math.max(frame - 8 - index * 6, 0), 14);
        return (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr auto",
              alignItems: "center",
              gap: 16,
              padding: "16px 18px",
              borderRadius: 22,
              background: highlighted ? "rgba(37, 99, 235, 0.10)" : "rgba(248, 250, 252, 1)",
              border: highlighted
                ? "1px solid rgba(37, 99, 235, 0.28)"
                : "1px solid rgba(15, 23, 42, 0.06)",
              opacity: progress,
              transform: `translateY(${14 - progress * 14 + bob(frame + index * 7, highlighted ? 2 : 1, 22)}px) scale(${highlighted ? pulse(frame + index * 4, 0.995, 1.01, 18) : popIn(progress, 0.97, 1.005, 0.8)})`,
              boxShadow: highlighted
                ? `0 14px 28px rgba(37,99,235,${shimmer(frame, 0.08, 0.16, 14)})`
                : "none",
            }}
          >
            <div
              style={{
                color: highlighted ? theme.colors.accent : "#475569",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: "#0f172a",
                fontSize: 28,
                fontWeight: highlighted ? 900 : 700,
              }}
            >
              {row.name}
              {row.region ? (
                <span
                  style={{
                    marginLeft: 12,
                    color: "#64748b",
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  {row.region}
                </span>
              ) : null}
            </div>
            <div
              style={{
                color: "#0f172a",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {row.valueLabel ?? ""}
            </div>
          </div>
        );
      })}
    </div>
  );
};
