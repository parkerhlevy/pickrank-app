import { theme } from "../lib/theme";

type AvatarRowProps = {
  avatars: string[];
};

export const AvatarRow = ({ avatars }: AvatarRowProps) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {avatars.map((avatar, index) => (
        <div
          key={`${avatar}-${index}`}
          style={{
            width: 64,
            height: 64,
            marginLeft: index === 0 ? 0 : -12,
            borderRadius: theme.radius.pill,
            border: "3px solid rgba(9, 17, 31, 0.9)",
            background: index % 2 === 0 ? "#2563eb" : "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {avatar}
        </div>
      ))}
    </div>
  );
};
