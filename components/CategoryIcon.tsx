import {
  Building2, Cable, Calculator, Clapperboard, Cpu, Crown, Grid3x3, HelpCircle, Image, Lamp, Lightbulb, Map, Move, PaintBucket,
  Route, SquareDashed, Sparkles, Spline, SunMoon, Tent, TestTubes, Waypoints, WholeWord, ChevronsLeftRight, type LucideIcon,
} from "lucide-react";

// 3D mascot artwork for each quiz category (public/images/cat-*.webp).
// Categories without artwork yet fall back to an icon on the same tile.
const ART = new Set(["pakistan", "cricket", "world", "science", "math", "it", "ai", "entertainment"]);
const FALLBACK: Record<string, { icon: LucideIcon; color: string }> = {
  it: { icon: Cpu, color: "#5fd3ff" },
  ai: { icon: Sparkles, color: "#b79bff" },
  entertainment: { icon: Clapperboard, color: "#ff6fb8" },
  crowns: { icon: Crown, color: "#ffd36e" },
  sunmoon: { icon: SunMoon, color: "#ffb86b" },
  path: { icon: Route, color: "#7fe0b8" },
  maze: { icon: Map, color: "#8fd0ff" },
  oneline: { icon: Spline, color: "#b79bff" },
  link: { icon: Cable, color: "#ff6b8b" },
  sudoku: { icon: Grid3x3, color: "#5fa8ff" },
  futoshiki: { icon: ChevronsLeftRight, color: "#ffcf5a" },
  skyscraper: { icon: Building2, color: "#8fd0ff" },
  lights: { icon: Lightbulb, color: "#ffd36e" },
  nonogram: { icon: Image, color: "#4fd1a5" },
  hitori: { icon: SquareDashed, color: "#ff9fb6" },
  tents: { icon: Tent, color: "#7fe0b8" },
  akari: { icon: Lamp, color: "#ffcf5a" },
  slide: { icon: Move, color: "#b48cff" },
  flood: { icon: PaintBucket, color: "#ff9f5a" },
  target: { icon: Calculator, color: "#18e29b" },
  words: { icon: WholeWord, color: "#5fd3ff" },
  pipes: { icon: Waypoints, color: "#5fa8ff" },
  balls: { icon: TestTubes, color: "#ff6fb8" },
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
