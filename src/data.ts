import { episodeMetadataBySeason } from "./metadata/index.ts";

export type MediaType = "Movie" | "Anime";

export type Episode = {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  available: boolean;
  seasonId?: string;
};

export type Season = {
  id: string;
  label: string;
  image?: string;
  episodes: Episode[];
};

export type Title = {
  id: string;
  title: string;
  type: MediaType;
  year: string;
  rating: string;
  genre: string;
  runtime: string;
  description: string;
  image: string;
  episodes?: Episode[];
  seasons?: Season[];
};

const images = {
  jjk0: "/artwork/jujutsu-kaisen-0.webp",
  castle: "/artwork/infinity-castle.webp",
  city: "/artwork/jujutsu-kaisen-season-1.webp",
  demon: "/artwork/demon-slayer.webp",
  reze: "/artwork/chainsaw-man-reze-arc.webp",
  chainsaw: "/artwork/chainsaw-man-season-1.webp",
  soloLeveling: "/artwork/solo-leveling-season-1.webp",
  soloLevelingSeason2: "/artwork/solo-leveling-season-2.webp",
  yourName: "/artwork/your-name.webp",
  endgame: "/artwork/avengers-endgame.webp",
};

type EpisodeTemplate = Partial<
  Pick<Episode, "id" | "duration" | "available">
>;

function makeSeason(
  id: string,
  label: string,
  episodeCount: number,
  knownEpisodes: Record<number, EpisodeTemplate> = {},
  defaults: { available?: boolean; duration?: string; image?: string } = {},
): Season {
  const metadata = episodeMetadataBySeason[id];
  if (!metadata || metadata.length !== episodeCount) {
    throw new Error(`Episode metadata is incomplete for season: ${id}`);
  }
  return {
    id,
    label,
    image: defaults.image,
    episodes: Array.from({ length: episodeCount }, (_, index) => {
      const number = index + 1;
      const known = knownEpisodes[number] ?? {};
      const editorial = metadata[index];
      const available = known.available ?? defaults.available ?? false;
      return {
        id: known.id ?? `${id}-episode-${number}`,
        number,
        title: editorial.title,
        description: editorial.description,
        duration: known.duration ?? defaults.duration ?? "23m",
        available,
        seasonId: id,
      };
    }),
  };
}

export function getEpisodes(title: Title) {
  return (
    title.seasons?.flatMap((season) => season.episodes) ?? title.episodes ?? []
  );
}

export function isPlayable(episode: Episode): boolean {
  return episode.available;
}

export const titles: Title[] = [
  {
    id: "jujutsu-kaisen-0",
    title: "Jujutsu Kaisen 0",
    type: "Movie",
    year: "2021",
    rating: "8.6",
    genre: "Supernatural",
    runtime: "1h 45m",
    description:
      "Yuta Okkotsu is haunted by the spirit of his childhood friend. At Tokyo Jujutsu High, he learns to control the curse and fight beside other sorcerers.",
    image: images.jjk0,
    episodes: [
      {
        id: "movie",
        number: 1,
        title: "Jujutsu Kaisen 0",
        description:
          "Haunted by Rika’s curse, Yuta enters Jujutsu High to learn control while a former sorcerer prepares an attack on the city.",
        duration: "1h 45m",
        available: true,
      },
    ],
  },
  {
    id: "infinity-castle",
    title: "Infinity Castle",
    type: "Movie",
    year: "2025",
    rating: "9.1",
    genre: "Dark fantasy",
    runtime: "2h 16m",
    description:
      "The Demon Slayer Corps enters Muzan Kibutsuji’s shifting fortress for a final battle where every room changes the fight.",
    image: images.castle,
    episodes: [
      {
        id: "movie",
        number: 1,
        title: "Infinity Castle",
        description:
          "Muzan draws Tanjiro and the Hashira into a shifting demon fortress, turning their rescue mission into a battle on unfamiliar ground.",
        duration: "2h 16m",
        available: true,
      },
    ],
  },
  {
    id: "chainsaw-man-reze-arc",
    title: "Chainsaw Man – The Movie: Reze Arc",
    type: "Movie",
    year: "2025",
    rating: "—",
    genre: "Action",
    runtime: "Feature film",
    description:
      "Denji meets Reze, a mysterious girl who draws him into a new chapter of love, danger, and devil hunting.",
    image: images.reze,
    episodes: [
      {
        id: "movie",
        number: 1,
        title: "Chainsaw Man – The Movie: Reze Arc",
        description:
          "Denji’s growing bond with Reze complicates his life as a devil hunter, as hidden enemies turn a new romance into danger.",
        duration: "Feature film",
        available: true,
      },
    ],
  },
  {
    id: "your-name",
    title: "Your Name",
    type: "Movie",
    year: "2016",
    rating: "—",
    genre: "Romance",
    runtime: "1h 47m",
    description:
      "A Tokyo boy and a girl in rural Japan begin waking up in each other’s bodies. As they search for one another, a connection across distance and time changes their lives.",
    image: images.yourName,
    episodes: [
      {
        id: "movie",
        number: 1,
        title: "Your Name",
        description:
          "Mitsuha and Taki begin exchanging lives through mysterious dreams, linking a quiet mountain town with Tokyo as a comet approaches. Hindi version.",
        duration: "1h 47m",
        available: true,
      },
    ],
  },
  {
    id: "avengers-endgame",
    title: "Avengers: Endgame",
    type: "Movie",
    year: "2019",
    rating: "—",
    genre: "Superhero",
    runtime: "3h 1m",
    description:
      "After Thanos wipes out half of all life, the surviving Avengers reunite for one last mission to undo the devastation and bring back the people they lost.",
    image: images.endgame,
    episodes: [
      {
        id: "movie",
        number: 1,
        title: "Avengers: Endgame",
        description:
          "After Thanos’s devastating victory, the remaining Avengers struggle with their losses and gather the resolve for another confrontation. Hindi version.",
        duration: "3h 1m",
        available: true,
      },
    ],
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    type: "Anime",
    year: "2020",
    rating: "8.7",
    genre: "Action",
    runtime: "3 seasons",
    description:
      "Yuji Itadori joins Tokyo Jujutsu High after swallowing a cursed finger and becoming the vessel of Ryomen Sukuna.",
    image: images.city,
    seasons: [
      makeSeason("jujutsu-kaisen-season-1", "Season 1", 24, {
        1: { id: "episode-1" },
        2: { id: "episode-2" },
      }, { available: true }),
      makeSeason(
        "jujutsu-kaisen-season-2",
        "Season 2 · Hidden Inventory / Shibuya Incident",
        23,
        {},
        { available: true },
      ),
      makeSeason(
        "jujutsu-kaisen-season-3",
        "Season 3 · The Culling Game: Part 1",
        12,
        {},
        { available: true },
      ),
    ],
  },
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    type: "Anime",
    year: "2022",
    rating: "—",
    genre: "Action",
    runtime: "1 season",
    description:
      "Betrayed and left for dead, Denji merges with his chainsaw devil companion Pochita. Reborn as Chainsaw Man, he joins Public Safety’s devil hunters in pursuit of a better life.",
    image: images.chainsaw,
    seasons: [
      makeSeason("chainsaw-man-season-1", "Season 1", 12, {}, {
        available: true,
        duration: "24m",
        image: images.chainsaw,
      }),
    ],
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    type: "Anime",
    year: "2024",
    rating: "—",
    genre: "Fantasy",
    runtime: "2 seasons",
    description:
      "Known as the weakest hunter, Sung Jinwoo barely survives a deadly dungeon. A mysterious system gives him the power to grow stronger, drawing him into the secrets behind the gates.",
    image: images.soloLeveling,
    seasons: [
      makeSeason("solo-leveling-season-1", "Season 1", 12, {}, {
        available: true,
        duration: "24m",
        image: images.soloLeveling,
      }),
      makeSeason("solo-leveling-season-2", "Season 2 · Arise from the Shadow", 13, {}, {
        available: true,
        duration: "24m",
        image: images.soloLevelingSeason2,
      }),
    ],
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    type: "Anime",
    year: "2019",
    rating: "8.6",
    genre: "Action",
    runtime: "63 episodes",
    description:
      "Tanjiro Kamado joins the Demon Slayer Corps after a demon attack changes his family forever.",
    image: images.demon,
    seasons: [
      makeSeason("demon-slayer-season-1", "Season 1 · Unwavering Resolve", 26, {
        1: { available: true },
        2: { available: true },
      }),
      makeSeason("demon-slayer-mugen-train", "Season 2 · Mugen Train", 7),
      makeSeason(
        "demon-slayer-entertainment-district",
        "Season 2 · Entertainment District",
        11,
      ),
      makeSeason(
        "demon-slayer-swordsmith-village",
        "Season 3 · Swordsmith Village",
        11,
      ),
      makeSeason(
        "demon-slayer-hashira-training",
        "Season 4 · Hashira Training",
        8,
      ),
    ],
  },
];
