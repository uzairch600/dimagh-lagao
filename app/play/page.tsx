import type { Metadata } from "next";
import GameApp from "@/components/GameApp";

export const metadata: Metadata = { title: "Khelein", robots: { index: false } };

export default function PlayPage() {
  return <GameApp />;
}
