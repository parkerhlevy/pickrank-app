import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { entrance, rise, scaleIn } from "../lib/motion";
import { theme } from "../lib/theme";

type RankingSceneProps = {
  rankedPlayers: string[];
  draggedPlayer: string;
  draggedFrom: number;
  draggedTo: number;
  accentColor: string;
};

export const RankingScene = ({
  rankedPlayers,
  draggedPlayer,
  draggedFrom,
  draggedTo,
  accentColor,
}: RankingSceneProps) => {
  const frame = useCurrentFrame();
  const intro = entrance(frame, 20);
  const ui = entrance(Math.max(frame - 8, 0), 24);
  const holdProgress = Math.min(1, Math.max(0, (frame - 20) / 12));
  const dragProgress = Math.min(1, Math.max(0, (frame - 34) / 34));
  const settleProgress = Math.min(1, Math.max(0, (frame - 70) / 16));

  const fromIndex = draggedFrom - 1;
  const toIndex = draggedTo - 1;

  return (
    <AbsoluteFill
      style={{
        padding: "72px 88px",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <SceneBackdrop accentColor={accentColor} mode="center" />
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
        <SectionEyebrow label="Step 2" />
        <div
          style={{
            color: theme.colors.text,
            fontSize: 86,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 0.94,
          }}
        >
          Drag into
          <br />
          your order.
        </div>
        <div style={{ color: theme.colors.mutedText, fontSize: 28, fontWeight: 600 }}>
          Put your #1 where you think the week will finish.
        </div>
      </div>
      <div
        style={{
          position: "relative",
          transform: `scale(${scaleIn(ui)})`,
          opacity: ui,
        }}
      >
        <PhoneFrame>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 18,
              height: "100%",
              background: "linear-gradient(180deg, #f8fbff 0%, #edf3fb 100%)",
            }}
          >
            <div style={{ color: "#1e293b", fontSize: 20, fontWeight: 900 }}>Top 10 order</div>
            {rankedPlayers.map((player, index) => {
              const isDragged = player === draggedPlayer;
              const movingUp = index >= toIndex && index < fromIndex && dragProgress > 0;
              const y =
                isDragged
                  ? (toIndex - fromIndex) * 64 * dragProgress
                  : movingUp
                    ? 64 * dragProgress
                    : 0;
              const draggedScale = isDragged ? 1 + holdProgress * 0.03 - settleProgress * 0.03 : 1;
              const draggedRotate = isDragged ? -3 * holdProgress + 3 * settleProgress : 0;
              return (
                <div
                  key={player}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 18,
                    background: isDragged ? "rgba(37,99,235,0.14)" : "rgba(255,255,255,0.92)",
                    border: isDragged
                      ? `1px solid ${accentColor}`
                      : "1px solid rgba(15,23,42,0.08)",
                    transform: `translateY(${y}px) scale(${draggedScale}) rotate(${draggedRotate}deg)`,
                    boxShadow: isDragged ? "0 16px 28px rgba(37,99,235,0.18)" : "none",
                  }}
                >
                  <div style={{ color: accentColor, fontSize: 16, fontWeight: 900 }}>{index + 1}</div>
                  <div style={{ color: "#0f172a", fontSize: 17, fontWeight: 700 }}>{player}</div>
                  <div
                    style={{
                      marginLeft: "auto",
                      color: "#64748b",
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    ≡
                  </div>
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                top: 118 + (toIndex + 0.5) * 56,
                left: 18,
                right: 18,
                height: 3,
                borderRadius: 999,
                background: `rgba(37,99,235,${0.2 + settleProgress * 0.65})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 126 + (fromIndex - 0.2) * 56 + (toIndex - fromIndex) * 56 * dragProgress,
                left: 420,
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "rgba(15,23,42,0.92)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                transform: `scale(${0.9 + holdProgress * 0.12})`,
              }}
            >
              ↓
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
