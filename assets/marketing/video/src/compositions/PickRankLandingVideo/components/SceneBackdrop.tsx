import { AbsoluteFill, useCurrentFrame } from "remotion";
import { drift } from "../lib/motion";

type SceneBackdropProps = {
  accentColor: string;
  mode?: "top-left" | "top-right" | "bottom-left" | "center";
};

export const SceneBackdrop = ({
  accentColor,
  mode = "center",
}: SceneBackdropProps) => {
  const frame = useCurrentFrame();
  const x = drift(frame, 40, 70);
  const y = drift(frame + 20, 32, 90);

  const anchorMap = {
    "top-left": `20% 16%`,
    "top-right": `82% 18%`,
    "bottom-left": `18% 82%`,
    center: `50% 50%`,
  } as const;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(9, 17, 31, 1) 0%, rgba(11, 21, 38, 1) 55%, rgba(15, 27, 49, 1) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${anchorMap[mode]}, ${accentColor}33 0%, transparent 26%)`,
          transform: `translate(${x}px, ${y}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          background:
            "linear-gradient(110deg, transparent 0%, transparent 42%, rgba(255,255,255,0.14) 50%, transparent 58%, transparent 100%)",
          transform: `translateX(${drift(frame + 30, 220, 36)}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.32,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage: "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 55%, rgba(4, 10, 21, 0.36) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
