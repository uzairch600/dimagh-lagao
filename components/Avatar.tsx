import { Bot } from "lucide-react";

// Hand-drawn SVG animals (viewBox 0 0 100 100) so avatars look the same on every phone.
const INK = "#2b1d3a";

const Eyes = ({ y = 54, gap = 13, r = 5.5 }: { y?: number; gap?: number; r?: number }) => (
  <>
    {[50 - gap, 50 + gap].map((x) => (
      <g key={x}>
        <circle cx={x} cy={y} r={r} fill={INK} />
        <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.38} fill="#fff" />
      </g>
    ))}
  </>
);

const Cheeks = ({ y = 64, gap = 22 }: { y?: number; gap?: number }) => (
  <>
    <ellipse cx={50 - gap} cy={y} rx="6" ry="3.5" fill="#ff7a93" opacity="0.5" />
    <ellipse cx={50 + gap} cy={y} rx="6" ry="3.5" fill="#ff7a93" opacity="0.5" />
  </>
);

const Smile = ({ y = 70 }: { y?: number }) => (
  <path d={`M44 ${y} Q47 ${y + 4} 50 ${y} Q53 ${y + 4} 56 ${y}`} stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
);

export const ANIMALS: Record<string, { bg: [string, string]; art: React.ReactNode }> = {
  fox: {
    bg: ["#5fd3ff", "#1f5fd1"],
    art: (
      <>
        <path d="M16 46 L24 10 L46 30Z M84 46 L76 10 L54 30Z" fill="#f97316" />
        <path d="M22 38 L26 18 L39 30Z M78 38 L74 18 L61 30Z" fill="#7c2d12" />
        <ellipse cx="50" cy="58" rx="35" ry="29" fill="#f97316" />
        <path d="M15 58 Q30 66 50 66 Q70 66 85 58 Q80 86 50 88 Q20 86 15 58Z" fill="#fff7ed" />
        <Eyes y={53} gap={14} />
        <ellipse cx="50" cy="67" rx="5" ry="3.6" fill={INK} />
        <Smile y={73} />
      </>
    ),
  },
  cat: {
    bg: ["#a48bff", "#4c2bd1"],
    art: (
      <>
        <path d="M18 48 L22 12 L46 30Z M82 48 L78 12 L54 30Z" fill="#fcd9b6" />
        <path d="M24 40 L26 22 L39 31Z M76 40 L74 22 L61 31Z" fill="#ff9fb2" />
        <ellipse cx="50" cy="58" rx="33" ry="29" fill="#fcd9b6" />
        <path d="M40 30 L43 40 M50 28 L50 39 M60 30 L57 40" stroke="#e8a873" strokeWidth="3" strokeLinecap="round" />
        <Eyes y={55} gap={13} />
        <Cheeks y={65} gap={23} />
        <path d="M46 63 L54 63 L50 68Z" fill="#ff7a93" />
        <Smile y={69} />
        <path d="M14 62 L30 64 M14 70 L30 68 M86 62 L70 64 M86 70 L70 68" stroke="#b98c63" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  owl: {
    bg: ["#2ff0b0", "#0b7a55"],
    art: (
      <>
        <path d="M20 34 L24 10 L42 26Z M80 34 L76 10 L58 26Z" fill="#8b5e3c" />
        <ellipse cx="50" cy="57" rx="35" ry="34" fill="#8b5e3c" />
        <ellipse cx="50" cy="74" rx="21" ry="15" fill="#d6b48c" />
        <circle cx="35" cy="48" r="13" fill="#fff" />
        <circle cx="65" cy="48" r="13" fill="#fff" />
        <Eyes y={48} gap={15} r={6.5} />
        <path d="M45 57 L55 57 L50 66Z" fill="#f59e0b" />
        <path d="M40 74 Q44 77 48 74 M52 74 Q56 77 60 74 M44 81 Q48 84 52 81" stroke="#a9825a" strokeWidth="2" fill="none" />
      </>
    ),
  },
  bear: {
    bg: ["#ffd36e", "#d9771f"],
    art: (
      <>
        <circle cx="24" cy="30" r="12" fill="#a0673a" />
        <circle cx="76" cy="30" r="12" fill="#a0673a" />
        <circle cx="24" cy="30" r="6.5" fill="#f3c9a0" />
        <circle cx="76" cy="30" r="6.5" fill="#f3c9a0" />
        <circle cx="50" cy="56" r="33" fill="#a0673a" />
        <ellipse cx="50" cy="68" rx="15" ry="11" fill="#f3c9a0" />
        <Eyes y={50} gap={13} />
        <Cheeks y={62} gap={24} />
        <ellipse cx="50" cy="63" rx="5.5" ry="4" fill={INK} />
        <Smile y={70} />
      </>
    ),
  },
  bunny: {
    bg: ["#ff6fb8", "#9d174d"],
    art: (
      <>
        <ellipse cx="36" cy="24" rx="9" ry="22" fill="#fff" />
        <ellipse cx="64" cy="24" rx="9" ry="22" fill="#fff" />
        <ellipse cx="36" cy="26" rx="4.5" ry="15" fill="#ffb3c6" />
        <ellipse cx="64" cy="26" rx="4.5" ry="15" fill="#ffb3c6" />
        <circle cx="50" cy="62" r="29" fill="#fff" />
        <Eyes y={60} gap={12} />
        <Cheeks y={70} gap={20} />
        <ellipse cx="50" cy="69" rx="4" ry="3" fill="#ff7a93" />
        <path d="M50 72 L50 75 M46 77 Q50 80 54 77" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  penguin: {
    bg: ["#5fd3ff", "#0e7490"],
    art: (
      <>
        <circle cx="50" cy="54" r="35" fill="#1f2937" />
        <ellipse cx="39" cy="60" rx="16" ry="20" fill="#fff" />
        <ellipse cx="61" cy="60" rx="16" ry="20" fill="#fff" />
        <Eyes y={55} gap={11} />
        <Cheeks y={66} gap={21} />
        <path d="M43 64 L57 64 L50 73Z" fill="#f59e0b" />
      </>
    ),
  },
  tiger: {
    bg: ["#43e5cf", "#0f766e"],
    art: (
      <>
        <circle cx="25" cy="30" r="11" fill="#fb923c" />
        <circle cx="75" cy="30" r="11" fill="#fb923c" />
        <circle cx="25" cy="30" r="5.5" fill="#fff7ed" />
        <circle cx="75" cy="30" r="5.5" fill="#fff7ed" />
        <ellipse cx="50" cy="58" rx="35" ry="31" fill="#fb923c" />
        <path d="M44 28 L50 42 L56 28Z M15 50 L30 54 L15 60Z M85 50 L70 54 L85 60Z M30 34 L36 44 M70 34 L64 44" fill={INK} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="50" cy="71" rx="17" ry="12" fill="#fff7ed" />
        <Eyes y={52} gap={14} />
        <ellipse cx="50" cy="66" rx="5" ry="3.6" fill={INK} />
        <Smile y={73} />
      </>
    ),
  },
  lion: {
    bg: ["#b79bff", "#3a1fa8"],
    art: (
      <>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={50 + Math.cos(a) * 30} cy={54 + Math.sin(a) * 30} r="13" fill="#c2410c" />;
        })}
        <circle cx="50" cy="54" r="31" fill="#c2410c" />
        <circle cx="31" cy="34" r="7" fill="#fbbf24" />
        <circle cx="69" cy="34" r="7" fill="#fbbf24" />
        <circle cx="50" cy="57" r="26" fill="#fbbf24" />
        <ellipse cx="50" cy="68" rx="12" ry="8.5" fill="#fef3c7" />
        <Eyes y={53} gap={11} r={5} />
        <ellipse cx="50" cy="64" rx="4.5" ry="3.3" fill={INK} />
        <Smile y={70} />
      </>
    ),
  },
};

const KEYS = Object.keys(ANIMALS);

// Accounts made before animal avatars existed get a stable animal based on their name.
function animalFor(avatar: string | undefined, name: string) {
  if (avatar && ANIMALS[avatar]) return ANIMALS[avatar];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ANIMALS[KEYS[h % KEYS.length]];
}

export function AnimalArt({ animal }: { animal: string }) {
  return (
    <svg viewBox="0 0 100 100" className="animal" aria-hidden="true">
      {ANIMALS[animal]?.art}
    </svg>
  );
}

type Props = { name: string; avatar?: string; size?: "sm" | "md" | "xl"; children?: React.ReactNode };

export default function Avatar({ name, avatar, size = "md", children }: Props) {
  const isBot = avatar === "bot";
  const a = animalFor(avatar, name);
  return (
    <span
      className={`avatar ${size === "md" ? "" : size}`}
      title={name}
      style={{ background: isBot ? "linear-gradient(135deg, #3a3f5c, #1b1e33)" : `linear-gradient(135deg, ${a.bg[0]}, ${a.bg[1]})` }}
    >
      {isBot ? (
        <Bot size={size === "xl" ? 44 : size === "sm" ? 18 : 22} />
      ) : (
        <svg viewBox="0 0 100 100" className="animal" aria-hidden="true">
          {a.art}
        </svg>
      )}
      {children}
    </span>
  );
}
