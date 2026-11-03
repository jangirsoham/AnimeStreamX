import { jujutsuKaisenMetadata } from "./jujutsu-kaisen.ts";
import { demonSlayerMetadata } from "./demon-slayer.ts";
import { chainsawManMetadata } from "./chainsaw-man.ts";
import { soloLevelingMetadata } from "./solo-leveling.ts";

export type EpisodeMetadata = { title: string; description: string };

/** Editorial summaries are independent of episode IDs and playback availability. */
export const episodeMetadataBySeason: Record<
  string,
  readonly EpisodeMetadata[]
> = {
  ...jujutsuKaisenMetadata,
  ...demonSlayerMetadata,
  ...chainsawManMetadata,
  ...soloLevelingMetadata,
};
