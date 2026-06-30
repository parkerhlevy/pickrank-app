import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { entrance, rise } from "../lib/motion";
import { SceneBackdrop } from "./SceneBackdrop";
import { theme } from "../lib/theme";

type FullscreenTextProps = {
  lines: string[];
  accentColor: string;
  align?: CSSProperties["alignItems"];
};

export const FullscreenText = ({
  lines,
  accentColor,
  align = "flex-start",
}: FullscreenTextProps) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: align,
        padding: "120px 112px",
      }}
    >
      <SceneBackdrop accentColor={accentColor} mode="top-left" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 1400,
        }}
      >
        {lines.map((line, index) => {
          const progress = entrance(Math.max(frame - index * 12, 0), 28);
          return (
            <div
              key={line}
              style={{
                position: "relative",
                color: index === lines.length - 1 ? accentColor : theme.colors.text,
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                opacity: progress,
                transform: `translateY(${rise(progress, 30)}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
