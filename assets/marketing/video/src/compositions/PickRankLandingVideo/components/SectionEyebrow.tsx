import { useCurrentFrame } from "remotion";
import { shimmer } from "../lib/motion";
import { theme } from "../lib/theme";

type SectionEyebrowProps = {
  label: string;
};

export const SectionEyebrow = ({ label }: SectionEyebrowProps) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "relative",
        alignSelf: "flex-start",
        padding: "10px 16px",
        borderRadius: theme.radius.pill,
        border: `1px solid ${theme.colors.border}`,
        background: theme.colors.surfaceSoft,
        color: theme.colors.mutedText,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: `0 0 0 1px rgba(255,255,255,${shimmer(frame, 0.03, 0.12, 18)}) inset`,
      }}
    >
      {label}
    </div>
  );
};
