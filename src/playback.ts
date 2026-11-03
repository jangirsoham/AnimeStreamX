import { useEffect, useRef, useState } from "react";

type PlaybackState =
  | { status: "idle" | "loading"; source?: never; error?: never }
  | { status: "ready"; source: string; error?: never }
  | { status: "error"; source?: never; error: string };

const messages: Record<string, string> = {
  episode_unavailable:
    "This episode is not available right now. Try another chapter.",
  source_unavailable:
    "Playback is temporarily unavailable. Please try again later.",
  playback_configuration_error:
    "Playback is temporarily unavailable. Please try again later.",
};

/** Resolves one player on demand; never downloads the complete source catalog. */
export function usePlayback(titleId: string, episodeId?: string) {
  const [state, setState] = useState<PlaybackState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    setState({ status: "idle" });
    return () => request.current?.abort();
  }, [titleId, episodeId]);

  async function resolve(): Promise<boolean> {
    if (!episodeId) return false;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ titleId, episodeId }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const code =
          data && typeof data === "object" && "code" in data
            ? String(data.code)
            : "";
        throw new Error(
          messages[code] ??
            "We couldn’t open this player. Please try again in a moment.",
        );
      }
      if (
        !data ||
        typeof data !== "object" ||
        !("source" in data) ||
        typeof data.source !== "string"
      ) {
        throw new Error("The player could not be opened. Please try again.");
      }
      const source = new URL(data.source);
      if (source.protocol !== "https:" || source.username || source.password) {
        throw new Error("The player could not be opened. Please try again.");
      }
      if (request.current !== controller || controller.signal.aborted)
        return false;
      setState({ status: "ready", source: data.source });
      return true;
    } catch (error) {
      if (
        request.current !== controller ||
        (controller.signal.aborted && !timedOut)
      )
        return false;
      setState({
        status: "error",
        error: timedOut
          ? "That took longer than expected. Check your connection and try again."
          : error instanceof TypeError || error instanceof SyntaxError
            ? "We couldn’t connect to the player. Check your connection and try again."
            : error instanceof Error
              ? error.message
              : "Playback is unavailable. Please try again.",
      });
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
  return { ...state, resolve };
}
