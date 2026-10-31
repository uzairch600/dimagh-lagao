import type { Metadata } from "next";
import GameApp from "@/components/GameApp";
import ComingSoon from "@/components/ComingSoon";
import { GAME_LIVE } from "@/lib/site";

export const metadata: Metadata = { title: "Khelein", robots: { index: false } };

export default function PlayPage() {
  return GAME_LIVE ? <GameApp /> : <ComingSoon />;
}
