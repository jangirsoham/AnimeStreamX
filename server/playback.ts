import type { IncomingMessage, ServerResponse } from "node:http";
import { getEpisodes, isPlayable, titles } from "../src/data.ts";

type PlaybackEnvironment = {
  PLAYBACK_SOURCES_JSON?: string;
  APP_ORIGIN?: string;
};

type PlaybackRequest = IncomingMessage & { body?: unknown };
type Configuration =
  | { sources: Map<string, string>; appOrigin?: string }
  | { error: "missing" | "invalid" };

const MAX_BODY_BYTES = 2048;
const ALLOWED_PROVIDERS = new Set([
  "player.abyssplayer.com",
  "iframe.mediadelivery.net",
]);

class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function isIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 100 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseOrigin(value: string): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    /\s/.test(value)
  ) {
    throw new Error("Invalid origin");
  }
  return url.origin;
}

function readConfiguration(environment: PlaybackEnvironment): Configuration {
  if (!environment.PLAYBACK_SOURCES_JSON) return { error: "missing" };

  try {
    const parsed: unknown = JSON.parse(environment.PLAYBACK_SOURCES_JSON);
    if (!isRecord(parsed)) return { error: "invalid" };
    const sources = new Map<string, string>();

    for (const [key, value] of Object.entries(parsed)) {
      const identifiers = key.split("/");
      if (
        identifiers.length !== 2 ||
        !identifiers.every(isIdentifier) ||
        typeof value !== "string" ||
        value.length > 2048 ||
        /\s/.test(value)
      ) {
        return { error: "invalid" };
      }

      const url = new URL(value);
      if (
        url.protocol !== "https:" ||
        !ALLOWED_PROVIDERS.has(url.hostname) ||
        url.port ||
        url.username ||
        url.password ||
        url.hash
      ) {
        return { error: "invalid" };
      }

      // Preserve provider parameters exactly; never accept a source from the client.
      sources.set(key, value);
    }

    return {
      sources,
      appOrigin: environment.APP_ORIGIN
        ? parseOrigin(environment.APP_ORIGIN)
        : undefined,
    };
  } catch {
    return { error: "invalid" };
  }
}

function rejectForeignOrigin(
  request: PlaybackRequest,
  appOrigin?: string,
): void {
  const fetchSite = request.headers["sec-fetch-site"];
  const origin = request.headers.origin;
  const deny = () => {
    throw new RequestError(
      403,
      "cross_origin_request",
      "Playback requests must come from this site.",
    );
  };

  if (
    fetchSite &&
    (typeof fetchSite !== "string" ||
      !["same-origin", "same-site", "none"].includes(fetchSite))
  ) {
    deny();
  }

  // These browser signals reduce cross-site use; they are not authentication.
  // Non-browser clients can omit or forge them and must not be considered trusted.
  if (origin === undefined) return;
  if (typeof origin !== "string") deny();

  try {
    let expectedOrigin = appOrigin;
    if (!expectedOrigin) {
      const forwardedProtocol = request.headers["x-forwarded-proto"];
      const encrypted = (request.socket as { encrypted?: boolean }).encrypted;
      const protocol = forwardedProtocol ?? (encrypted ? "https" : "http");
      const host = request.headers.host;
      if (
        (protocol !== "http" && protocol !== "https") ||
        !host ||
        !/^(?:\[[0-9a-fA-F:.]+\]|[a-zA-Z0-9.-]+)(?::[0-9]{1,5})?$/.test(host)
      ) {
        deny();
      }
      expectedOrigin = parseOrigin(`${protocol}://${host}`);
    }

    if (parseOrigin(origin) !== expectedOrigin) deny();
  } catch {
    deny();
  }
}

function tooLarge(): RequestError {
  return new RequestError(
    413,
    "payload_too_large",
    "The playback request is too large.",
  );
}

function readStream(request: PlaybackRequest): Promise<string> {
  // Middleware may already have consumed an empty body without setting req.body.
  if (request.readableEnded) return Promise.resolve("");

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let bytes = 0;

    const cleanup = () => {
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onError);
      request.off("aborted", onAborted);
    };
    const fail = (error: RequestError) => {
      cleanup();
      // Drain an oversized upload without buffering it or destroying the response.
      request.once("error", () => {});
      request.resume();
      reject(error);
    };
    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > MAX_BODY_BYTES) return fail(tooLarge());
      chunks.push(buffer);
    };
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const onError = () => {
      fail(
        new RequestError(
          400,
          "invalid_request",
          "The playback request failed.",
        ),
      );
    };
    const onAborted = () => onError();

    request.on("data", onData);
    request.once("end", onEnd);
    request.once("error", onError);
    request.once("aborted", onAborted);
  });
}

async function readPayload(request: PlaybackRequest): Promise<unknown> {
  const contentLength = request.headers["content-length"];
  if (contentLength !== undefined) {
    if (!/^\d+$/.test(contentLength)) {
      throw new RequestError(
        400,
        "invalid_request",
        "The playback request is invalid.",
      );
    }
    if (Number(contentLength) > MAX_BODY_BYTES) throw tooLarge();
  }

  let body: unknown = request.body;
  if (body === undefined) body = await readStream(request);
  if (Buffer.isBuffer(body)) body = body.toString("utf8");

  try {
    const serialized = typeof body === "string" ? body : JSON.stringify(body);
    if (serialized === undefined) throw new Error("Invalid JSON");
    if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES)
      throw tooLarge();
    return typeof body === "string" ? (JSON.parse(body) as unknown) : body;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(
      400,
      "invalid_json",
      "The playback request contains invalid JSON.",
    );
  }
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, string>,
): void {
  if (response.writableEnded || response.destroyed) return;
  response.statusCode = status;
  response.end(JSON.stringify(body));
}

/** Shared by Vercel and the local Vite server. Environment stays server-side. */
export function createPlaybackHandler(
  environment: PlaybackEnvironment = process.env,
): (request: PlaybackRequest, response: ServerResponse) => Promise<void> {
  const configuration = readConfiguration(environment);

  return async (request, response) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");

    try {
      if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        throw new RequestError(
          405,
          "method_not_allowed",
          "Use POST to request playback.",
        );
      }

      rejectForeignOrigin(
        request,
        "appOrigin" in configuration ? configuration.appOrigin : undefined,
      );

      const contentType = request.headers["content-type"];
      const encoding = request.headers["content-encoding"];
      if (
        contentType?.split(";", 1)[0].trim().toLowerCase() !==
          "application/json" ||
        (encoding !== undefined && encoding !== "identity")
      ) {
        throw new RequestError(
          415,
          "unsupported_media_type",
          "Send the playback request as JSON.",
        );
      }

      const payload = await readPayload(request);
      if (
        !isRecord(payload) ||
        !isIdentifier(payload.titleId) ||
        !isIdentifier(payload.episodeId) ||
        Object.keys(payload).some(
          (key) => key !== "titleId" && key !== "episodeId",
        )
      ) {
        throw new RequestError(
          400,
          "invalid_request",
          "Choose a valid title and episode.",
        );
      }

      const title = titles.find((entry) => entry.id === payload.titleId);
      const episode =
        title &&
        getEpisodes(title).find((entry) => entry.id === payload.episodeId);
      if (!title || !episode) {
        throw new RequestError(
          404,
          "not_found",
          "This title or episode could not be found.",
        );
      }
      if (!isPlayable(episode)) {
        throw new RequestError(
          404,
          "episode_unavailable",
          "This episode is not available yet.",
        );
      }
      if ("error" in configuration) {
        throw new RequestError(
          503,
          "playback_configuration_error",
          configuration.error === "missing"
            ? "Playback is not configured. Please try again later."
            : "Playback configuration is invalid. Please try again later.",
        );
      }

      const source = configuration.sources.get(`${title.id}/${episode.id}`);
      if (!source) {
        throw new RequestError(
          503,
          "source_unavailable",
          "This video is temporarily unavailable. Please try again later.",
        );
      }

      sendJson(response, 200, { source });
    } catch (error) {
      request.resume();
      const failure =
        error instanceof RequestError
          ? error
          : new RequestError(
              500,
              "playback_error",
              "Playback could not be started. Please try again.",
            );
      sendJson(response, failure.status, {
        error: failure.message,
        code: failure.code,
      });
    }
  };
}
