import type { ReactNode } from "react";
import { theme } from "../lib/theme";

type PhoneFrameProps = {
  children: ReactNode;
};

export const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div
      style={{
        width: 540,
        height: 900,
        borderRadius: 48,
        padding: 18,
        background: "linear-gradient(180deg, #172033 0%, #0b1220 100%)",
        boxShadow: theme.shadow.card,
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 34,
          overflow: "hidden",
          background: "linear-gradient(180deg, #f8fbff 0%, #e7eef8 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
