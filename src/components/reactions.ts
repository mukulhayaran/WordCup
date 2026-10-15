import { Crown, FaceGrinning, Flame, Heart, type LucideIcon } from "lucide-react";
import type { Reaction } from "@/lib/socialRules";

export const REACTION_ICONS: Record<Reaction, { Icon: LucideIcon; label: string }> = {
  heart: { Icon: Heart, label: "Heart" },
  laugh: { Icon: FaceGrinning, label: "Laugh" },
  fire: { Icon: Flame, label: "Fire" },
  crown: { Icon: Crown, label: "Crown" },
};
