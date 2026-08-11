import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { entrance, rise, scaleIn } from "../lib/motion";
import { theme } from "../lib/theme";

type SelectionSceneProps = {
  headlineLines: [string, string];
  poolLabel: string;
  boardLabel: string;
  statCategory: string;
  allPlayers: string[];
  selectedPlayers: string[];
  accentColor: string;
};

export const SelectionScene = ({
  headlineLines,
  poolLabel,
  boardLabel,
  statCategory,
  allPlayers,
  selectedPlayers,
  accentColor,
}: SelectionSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 20);
  const listProgress = entrance(Math.max(frame - 10, 0), 24);
  const selectedCount = Math.min(selectedPlayers.length, Math.max(0, Math.floor((frame - 18) / 8)));
  const visiblePoolPlayers = allPlayers.slice(0, 12);
  const remainingPoolCount = Math.max(0, allPlayers.length - visiblePoolPlayers.length);

  return (
    <AbsoluteFill
      style={{
        padding: "72px 88px",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <SceneBackdrop accentColor={accentColor} mode="top-right" />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 520,
          opacity: intro,
          transform: `translateY(${rise(intro, 24)}px)`,
        }}
      >
        <SectionEyebrow label="Step 1" />
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 0.94,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ color: theme.colors.text }}>{headlineLines[0]}</div>
          <div style={{ color: accentColor }}>{headlineLines[1]}</div>
        </div>
        <div
          style={{
            color: theme.colors.mutedText,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.25,
          }}
        >
          This week: {statCategory}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          transform: `scale(${scaleIn(listProgress)})`,
          opacity: listProgress,
        }}
      >
        <PhoneFrame>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 14,
              height: "100%",
              padding: 18,
              background: "linear-gradient(180deg, #f8fbff 0%, #edf3fb 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 12,
                borderRadius: 24,
                background: "rgba(255,255,255,0.88)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ color: "#334155", fontSize: 18, fontWeight: 900 }}>{poolLabel}</div>
                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(37,99,235,0.08)",
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {allPlayers.length} total
                </div>
              </div>
              {visiblePoolPlayers.map((player) => {
                const selected = selectedPlayers.includes(player) && selectedPlayers.indexOf(player) < selectedCount;
                return (
                  <div
                    key={player}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 16,
                      background: selected ? "rgba(37,99,235,0.08)" : "rgba(248,250,252,1)",
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                  >
                    <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{player}</div>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: selected ? accentColor : "rgba(148,163,184,0.35)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {selected ? "+" : ""}
                    </div>
                  </div>
                );
              })}
              {remainingPoolCount > 0 ? (
                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: 16,
                    background: "rgba(37,99,235,0.08)",
                    border: "1px solid rgba(37,99,235,0.14)",
                    color: accentColor,
                    fontSize: 14,
                    fontWeight: 900,
                    textAlign: "center",
                  }}
                >
                  +{remainingPoolCount} more in pool
                </div>
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 12,
                borderRadius: 24,
                background: "rgba(15,23,42,0.94)",
              }}
            >
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{boardLabel}</div>
              {selectedPlayers.slice(0, Math.max(1, selectedCount)).map((player, index) => (
                <div
                  key={player}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>{index + 1}</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{player}</div>
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
