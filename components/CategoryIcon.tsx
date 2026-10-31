import { Clapperboard, Cpu, HelpCircle, Sparkles, type LucideIcon } from "lucide-react";

// 3D mascot artwork for each quiz category (public/images/cat-*.webp).
// Categories without artwork yet fall back to an icon on the same tile.
const ART = new Set(["pakistan", "cricket", "world", "science", "math"]);
const FALLBACK: Record<string, { icon: LucideIcon; color: string }> = {
  it: { icon: Cpu, color: "#5fd3ff" },
  ai: { icon: Sparkles, color: "#b79bff" },
  entertainment: { icon: Clapperboard, color: "#ff6fb8" },
};

type Props = { id: string; name?: string; className?: string };

export default function CategoryIcon({ id, name = "", className = "cat-icon cat-art" }: Props) {
  if (ART.has(id)) {
    return (
      <span className={className}>
        <img src={`/images/cat-${id}.webp`} alt={name} width={480} height={480} loading="lazy" />
      </span>
    );
  }
  const { icon: Icon, color } = FALLBACK[id] ?? { icon: HelpCircle, color: "#a3a1c9" };
  return (
    <span className={`${className} cat-fallback`} style={{ color, background: `radial-gradient(circle at 50% 40%, ${color}33, #0d0b26 70%)` }}>
      <Icon strokeWidth={1.8} />
    </span>
  );
}
