import { AbsoluteFill } from "remotion";
import type { PickRankLaunchVideoProps } from "./schema";
import { EndCard } from "./components/EndCard";
import { SceneBackdrop } from "./components/SceneBackdrop";

export const PickRankLandingThumb = ({
  scenes,
}: PickRankLaunchVideoProps) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SceneBackdrop accentColor="#2563eb" mode="center" />
      <EndCard
        headline={scenes.cta.headline}
        lines={scenes.cta.supportingLines}
        ctaLabel={scenes.cta.ctaLabel}
        ctaUrlLabel={scenes.cta.ctaUrlLabel}
      />
    </AbsoluteFill>
  );
};
