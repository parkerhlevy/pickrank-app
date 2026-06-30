import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import {
  blurIn,
  bob,
  clipReveal,
  entrance,
  popIn,
  rise,
  shimmer,
} from "../lib/motion";
import { theme } from "../lib/theme";

type KineticHeadlineProps = {
  lines: string[];
  accentColor: string;
  accentLineIndices?: number[];
  fontSize?: number;
  gap?: number;
  maxWidth?: number;
  align?: CSSProperties["alignItems"];
};

export const KineticHeadline = ({
  lines,
  accentColor,
  accentLineIndices = [],
  fontSize = 96,
  gap = 12,
  maxWidth = 1080,
  align = "flex-start",
}: KineticHeadlineProps) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        gap,
        maxWidth,
      }}
    >
      {lines.map((line, index) => {
        const progress = entrance(Math.max(frame - index * 10, 0), 18);
        const highlighted = accentLineIndices.includes(index);

        return (
          <div
            key={line}
            style={{
              overflow: "hidden",
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                color: highlighted ? accentColor : theme.colors.text,
                fontSize,
                fontWeight: 900,
                letterSpacing: "-0.07em",
                lineHeight: 0.92,
                opacity: progress,
                filter: `blur(${blurIn(progress)}px)`,
                clipPath: `inset(0 ${clipReveal(progress)}% 0 0)`,
                transform: `translateY(${rise(progress, 40) + bob(frame + index * 8, 2, 22)}px) scale(${popIn(progress, 0.92, 1.025)})`,
                textShadow: highlighted
                  ? `0 0 28px rgba(37, 99, 235, ${shimmer(frame + index * 4, 0.12, 0.32, 14)})`
                  : "none",
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
};
