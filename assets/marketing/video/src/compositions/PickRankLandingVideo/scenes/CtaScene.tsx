import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EndCard } from "../components/EndCard";
import { SceneBackdrop } from "../components/SceneBackdrop";
import { bob, entrance, popIn } from "../lib/motion";

type CtaSceneProps = {
  headline: string;
  supportingLines: string[];
  ctaLabel: string;
  ctaUrlLabel: string;
};

export const CtaScene = ({
  headline,
  supportingLines,
  ctaLabel,
  ctaUrlLabel,
}: CtaSceneProps) => {
  const frame = useCurrentFrame();
  const progress = entrance(frame, 20);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SceneBackdrop accentColor="#2563eb" mode="center" />
      <div
        style={{
          position: "relative",
          transform: `translateY(${bob(frame, 4, 18)}px) scale(${popIn(progress, 0.9, 1.025)})`,
          opacity: progress,
        }}
      >
        <EndCard
          headline={headline}
          lines={supportingLines}
          ctaLabel={ctaLabel}
          ctaUrlLabel={ctaUrlLabel}
        />
      </div>
    </AbsoluteFill>
  );
};
