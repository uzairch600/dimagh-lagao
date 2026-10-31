// 3D mascot artwork for each quiz category (public/images/cat-*.webp).
const KNOWN = new Set(["pakistan", "cricket", "world", "science", "math"]);

export default function CategoryIcon({ id, name = "" }: { id: string; name?: string }) {
  return (
    <span className="cat-icon cat-art">
      {KNOWN.has(id) && <img src={`/images/cat-${id}.webp`} alt={name} width={96} height={96} loading="lazy" />}
    </span>
  );
}
