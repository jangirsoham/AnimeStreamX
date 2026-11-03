import { jujutsuKaisenMetadata } from "./jujutsu-kaisen.js";
import { demonSlayerMetadata } from "./demon-slayer.js";
import { chainsawManMetadata } from "./chainsaw-man.js";
import { soloLevelingMetadata } from "./solo-leveling.js";

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
