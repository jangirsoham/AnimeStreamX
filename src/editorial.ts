import { getEpisodes, isPlayable, titles, type Title } from "./data";

export const titlePath = (title: Title) => `/title/${title.id}`;
export const watchPath = (title: Title, episodeId: string) =>
  `/watch/${title.id}/${episodeId}`;
export const firstPlayable = (title: Title) =>
  getEpisodes(title).find(isPlayable);
export const availableCount = (title: Title) =>
  getEpisodes(title).filter(isPlayable).length;
export const formatType = (title: Title) =>
  title.type === "Anime" ? "Series" : "Movie";
export const shortTitle = (title: Title) =>
  title.id === "chainsaw-man-reze-arc" ? "Chainsaw Man: Reze Arc" : title.title;
export const findTitle = (id?: string) =>
  titles.find(
    (title) =>
      title.id === (id === "jujutsu-kaisen-season-1" ? "jujutsu-kaisen" : id),
  );

export const spotlights = [
  {
    id: "infinity-castle",
    label: "Infinity Castle",
    kicker: "The battle goes deeper",
    heading: ["INFINITY", "CASTLE"],
    copy: "No way back. No room for fear. Enter the shifting fortress where the Demon Slayer Corps faces its greatest battle.",
    position: "center 29%",
  },
  {
    id: "chainsaw-man-reze-arc",
    label: "Reze Arc",
    kicker: "Love. Chaos. Chainsaws.",
    heading: ["CHAINSAW MAN", "REZE ARC"],
    copy: "A chance encounter. A dangerous connection. Denji’s world is about to get a whole lot more complicated.",
    position: "center 37%",
  },
  {
    id: "jujutsu-kaisen-0",
    label: "Jujutsu Kaisen 0",
    kicker: "Every curse has a beginning",
    heading: ["JUJUTSU", "KAISEN 0"],
    copy: "Before the story you know, there was a promise. Discover Yuta Okkotsu’s unforgettable introduction to the world of curses.",
    position: "center 32%",
  },
];

export const collections = [
  {
    id: "after-dark",
    title: "After dark",
    subtitle: "A little darker. A little stranger.",
    description:
      "Cursed spirits, shifting fortresses, and devils hiding in plain sight. These worlds are best explored with the lights down.",
    image: "/artwork/infinity-castle.webp",
    color: "blue",
    ids: [
      "infinity-castle",
      "chainsaw-man-reze-arc",
      "jujutsu-kaisen",
      "chainsaw-man",
      "solo-leveling",
    ],
  },
  {
    id: "movie-night",
    title: "Make it a movie night",
    subtitle: "One evening. A whole new world.",
    description:
      "Settle in for a feature-length escape. From a connection across time to battles that change everything, pick the story for tonight.",
    image: "/artwork/jujutsu-kaisen-0.webp",
    color: "olive",
    ids: [
      "jujutsu-kaisen-0",
      "infinity-castle",
      "chainsaw-man-reze-arc",
      "your-name",
      "avengers-endgame",
    ],
  },
  {
    id: "first-episode",
    title: "Just one more episode",
    subtitle: "Meet your next long-term obsession.",
    description:
      "Start at episode one and get to know the characters worth coming back for. Cursed spirits, devil hunters, and dangerous dungeons give you plenty of reasons to stay.",
    image: "/artwork/jujutsu-kaisen-season-1.webp",
    color: "violet",
    ids: ["jujutsu-kaisen", "demon-slayer", "chainsaw-man", "solo-leveling"],
  },
];

export const faqs = [
  {
    question: "How do I start watching?",
    answer:
      "Choose a title, open its details, and select Watch now or an available episode. The player has its own playback, volume, and fullscreen controls. For a series, you can switch seasons in the episode list.",
  },
  {
    question: "Why are some episodes unavailable?",
    answer:
      "The catalog includes the full season lineup, but only episodes marked Ready to watch can be played. Unavailable episodes stay visible so you can see where they belong in the story. There is no confirmed release date for those episodes yet.",
  },
  {
    question: "Where is my watchlist saved?",
    answer:
      "Your watchlist is saved in this browser on this device. You do not need an account. It will not sync to another device, and clearing your browser’s site data removes it. Private browsing or blocked storage may limit saving to your current visit.",
  },
  {
    question: "Does the site remember my playback position?",
    answer:
      "Recently opened helps you find the last episode you opened for each title. It does not track minutes watched or guarantee that a video resumes at the same position. Playback position, subtitles, and quality options depend on the video provider.",
  },
  {
    question: "What if a video will not play?",
    answer:
      "Use Reload player to try again, check your connection, or open another available episode. Video playback is provided by an external service, so its availability and controls may vary. Cinema mode gives the player more room and hides the episode sidebar until you leave it.",
  },
  {
    question: "What data is stored?",
    answer:
      "AnimStreamX stores your watchlist and recently opened episodes locally in this browser. You can remove entries from My list. Opening a video loads an external provider, and its own privacy practices apply. Fonts may also be loaded from Google Fonts.",
  },
];
