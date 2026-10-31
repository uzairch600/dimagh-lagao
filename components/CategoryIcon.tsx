import { CircleDot, FlaskConical, Globe, HelpCircle, Landmark, Zap, type LucideIcon } from "lucide-react";

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  pakistan: { icon: Landmark, color: "#2ff0b0" },
  cricket: { icon: CircleDot, color: "#ff6b85" },
  world: { icon: Globe, color: "#5fd3ff" },
  science: { icon: FlaskConical, color: "#b79bff" },
  math: { icon: Zap, color: "#ffd36e" },
};

export default function CategoryIcon({ id, size = 26 }: { id: string; size?: number }) {
  const { icon: Icon, color } = ICONS[id] ?? { icon: HelpCircle, color: "#a3a1c9" };
  return (
    <span className="cat-icon" style={{ color, background: `${color}1f`, borderColor: `${color}40` }}>
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}
