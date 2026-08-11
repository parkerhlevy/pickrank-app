import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { entrance, rise, scaleIn } from "../lib/motion";
import { theme } from "../lib/theme";

type RankingSceneProps = {
  supportingLine: string;
  rankedPlayers: string[];
  draggedPlayer: string;
  draggedFrom: number;
  draggedTo: number;
  accentColor: string;
};

export const RankingScene = ({
  supportingLine,
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
  const dragProgress = Math.min(1, Math.max(0, (frame - 34) / 28));
  const settleProgress = Math.min(1, Math.max(0, (frame - 66) / 16));

  const fromIndex = draggedFrom - 1;
  const toIndex = draggedTo - 1;
  const rowHeight = 58;
  const rowGap = 10;
  const listTop = 62;
  const rowStep = rowHeight + rowGap;

  const finalRankedPlayers = [...rankedPlayers];
  const [movedPlayer] = finalRankedPlayers.splice(fromIndex, 1);
  finalRankedPlayers.splice(toIndex, 0, movedPlayer);

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
          maxWidth: 620,
          opacity: intro,
          transform: `translateY(${rise(intro, 24)}px)`,
        }}
      >
        <SectionEyebrow label="Step 2" />
        <div
          style={{
            color: theme.colors.text,
            fontSize: 82,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 0.94,
          }}
        >
          Drag & drop
          <br />
          your order.
        </div>
        <div style={{ color: theme.colors.mutedText, fontSize: 28, fontWeight: 600 }}>
          {supportingLine}
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
              padding: 18,
              height: "100%",
              background: "linear-gradient(180deg, #f8fbff 0%, #edf3fb 100%)",
            }}
          >
            <div style={{ color: "#1e293b", fontSize: 20, fontWeight: 900 }}>Top 10 order</div>
            <div style={{ position: "relative", height: listTop + rowStep * rankedPlayers.length }}>
              {rankedPlayers.map((player, originalIndex) => {
                const isDragged = player === draggedPlayer;
                const finalIndex = finalRankedPlayers.indexOf(player);
                const currentY =
                  (originalIndex + (finalIndex - originalIndex) * dragProgress) * rowStep;
                const draggedScale = isDragged ? 1 + holdProgress * 0.03 - settleProgress * 0.03 : 1;
                const draggedRotate = isDragged ? -3 * holdProgress + 1.5 * settleProgress : 0;

                return (
                  <div
                    key={player}
                    style={{
                      position: "absolute",
                      top: listTop + currentY,
                      left: 0,
                      right: 0,
                      zIndex: isDragged ? 4 : 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      height: rowHeight,
                      padding: "10px 12px",
                      borderRadius: 18,
                      background: isDragged ? "rgba(37,99,235,0.14)" : "rgba(255,255,255,0.92)",
                      border: isDragged
                        ? `1px solid ${accentColor}`
                        : "1px solid rgba(15,23,42,0.08)",
                      transform: `scale(${draggedScale}) rotate(${draggedRotate}deg)`,
                      boxShadow: isDragged ? "0 16px 28px rgba(37,99,235,0.18)" : "none",
                    }}
                  >
                    <div style={{ color: accentColor, fontSize: 16, fontWeight: 900 }}>
                      {dragProgress > 0.55 ? finalIndex + 1 : originalIndex + 1}
                    </div>
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
            </div>
            <div
              style={{
                position: "absolute",
                top: listTop + toIndex * rowStep - 6,
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
                top:
                  listTop +
                  fromIndex * rowStep +
                  rowHeight / 2 -
                  5 +
                  (toIndex - fromIndex) * rowStep * dragProgress,
                right: 22,
                width: 10,
                height: 10,
                borderRadius: 999,
                background: accentColor,
                boxShadow: "0 0 0 8px rgba(37,99,235,0.16), 0 10px 22px rgba(37,99,235,0.24)",
                transform: `scale(${0.85 + holdProgress * 0.2})`,
              }}
            />
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
