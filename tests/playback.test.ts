import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, request as httpRequest } from "node:http";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createPlaybackHandler } from "../server/playback.ts";
import { getEpisodes, isPlayable, titles } from "../src/data.ts";

const selection = { titleId: "jujutsu-kaisen-0", episodeId: "movie" };
const key = `${selection.titleId}/${selection.episodeId}`;
const source = "https://player.abyssplayer.com/test-video";
const environment = {
  PLAYBACK_SOURCES_JSON: JSON.stringify({ [key]: source }),
};

type Response = {
  status: number;
  headers: IncomingHttpHeaders;
  body: { source?: string; code?: string; error?: string };
};

type Options = {
  environment?: Parameters<typeof createPlaybackHandler>[0];
  payload?: unknown;
  raw?: string;
  chunks?: string[];
  parsedBody?: unknown;
  consumeBody?: boolean;
  method?: string;
  headers?: Record<string, string>;
  sameOrigin?: boolean;
};

// Real Node HTTP requests exercise streaming and response headers without a browser.
async function invoke(options: Options = {}): Promise<Response> {
  const handler = createPlaybackHandler(options.environment ?? environment);
  const server = createServer((request, response) => {
    const respond = () => {
      if ("parsedBody" in options) {
        (request as IncomingMessage & { body?: unknown }).body =
          options.parsedBody;
        request.resume();
      }
      void handler(request, response);
    };
    if (options.consumeBody) {
      request.once("end", respond);
      request.resume();
    } else {
      respond();
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  try {
    return await new Promise<Response>((resolve, reject) => {
      const request = httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/playback",
          method: options.method ?? "POST",
          headers: {
            "content-type": "application/json",
            connection: "close",
            ...(options.sameOrigin
              ? { origin: `http://127.0.0.1:${port}` }
              : {}),
            ...options.headers,
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("error", reject);
          response.on("end", () => {
            try {
              resolve({
                status: response.statusCode ?? 0,
                headers: response.headers,
                body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
              });
            } catch (error) {
              reject(error);
            }
          });
        },
      );
      request.on("error", reject);
      if (options.chunks) {
        for (const chunk of options.chunks) request.write(chunk);
        request.end();
      } else {
        request.end(
          options.raw ?? JSON.stringify(options.payload ?? selection),
        );
      }
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function assertError(response: Response, status: number, code: string): void {
  assert.equal(response.status, status);
  assert.equal(response.body.code, code);
  assert.equal(typeof response.body.error, "string");
  assert.equal(response.body.source, undefined);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["access-control-allow-origin"], undefined);
}

test("returns only the selected source, with no caching or CORS grants", async () => {
  const response = await invoke({ sameOrigin: true });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { source });
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(
    response.headers["content-type"],
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["access-control-allow-origin"], undefined);
});

test("supports Vercel parsed bodies and streamed Vite requests", async () => {
  for (const parsedBody of [
    selection,
    JSON.stringify(selection),
    Buffer.from(JSON.stringify(selection)),
  ]) {
    const response = await invoke({ parsedBody });
    assert.equal(response.status, 200);
    assert.equal(response.body.source, source);
  }
  const response = await invoke({
    chunks: ['{"titleId":"jujutsu-', 'kaisen-0","episodeId":"movie"}'],
  });
  assert.equal(response.status, 200);
  assertError(await invoke({ consumeBody: true }), 400, "invalid_json");
});

test("preserves valid HTTPS provider parameters exactly", async () => {
  const providerSource =
    "https://iframe.mediadelivery.net/embed/test/library?autoplay=true&muted=false";
  const response = await invoke({
    environment: {
      PLAYBACK_SOURCES_JSON: JSON.stringify({ [key]: providerSource }),
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.source, providerSource);
});

test("every playable catalog entry resolves with a complete dummy source configuration", async () => {
  const selections = titles.flatMap((title) =>
    getEpisodes(title)
      .filter(isPlayable)
      .map((episode) => ({ titleId: title.id, episodeId: episode.id })),
  );
  assert.ok(selections.length > 0);
  const sources = Object.fromEntries(
    selections.map((entry) => {
      const entryKey = `${entry.titleId}/${entry.episodeId}`;
      return [entryKey, `https://player.abyssplayer.com/test/${entryKey}`];
    }),
  );
  const fixtureEnvironment = { PLAYBACK_SOURCES_JSON: JSON.stringify(sources) };
  for (const payload of selections) {
    const response = await invoke({ environment: fixtureEnvironment, payload });
    assert.equal(
      response.status,
      200,
      `Cannot resolve ${payload.titleId}/${payload.episodeId}`,
    );
    assert.equal(
      response.body.source,
      sources[`${payload.titleId}/${payload.episodeId}`],
    );
  }
});

test("rejects unsupported methods, media types, and malformed JSON", async () => {
  for (const method of ["GET", "PUT", "OPTIONS"]) {
    const response = await invoke({ method });
    assertError(response, 405, "method_not_allowed");
    assert.equal(response.headers.allow, "POST");
  }
  assertError(
    await invoke({ headers: { "content-type": "text/plain" } }),
    415,
    "unsupported_media_type",
  );
  assertError(
    await invoke({ headers: { "content-encoding": "gzip" } }),
    415,
    "unsupported_media_type",
  );
  assertError(await invoke({ raw: "{" }), 400, "invalid_json");
  assertError(await invoke({ raw: "" }), 400, "invalid_json");
});

test("accepts only a bounded title and episode selection", async () => {
  const invalidPayloads = [
    [],
    {},
    { ...selection, titleId: "../jujutsu-kaisen-0" },
    { ...selection, episodeId: "a".repeat(101) },
    { ...selection, titleId: 12 },
    { ...selection, source: "https://example.com" },
  ];
  for (const payload of invalidPayloads) {
    assertError(await invoke({ payload }), 400, "invalid_request");
  }
  assertError(await invoke({ raw: "null" }), 400, "invalid_request");
  assertError(
    await invoke({
      raw: '{"__proto__":{},"titleId":"jujutsu-kaisen-0","episodeId":"movie"}',
    }),
    400,
    "invalid_request",
  );
});

test("rejects unknown and unavailable catalog entries", async () => {
  assertError(
    await invoke({ payload: { ...selection, titleId: "missing-title" } }),
    404,
    "not_found",
  );
  assertError(
    await invoke({ payload: { ...selection, episodeId: "missing-episode" } }),
    404,
    "not_found",
  );
  const title = titles.find((entry) =>
    getEpisodes(entry).some((episode) => !isPlayable(episode)),
  );
  assert.ok(title, "The catalog should include pending episodes.");
  const episode = getEpisodes(title).find((entry) => !isPlayable(entry));
  assert.ok(episode);
  assertError(
    await invoke({
      payload: { titleId: title.id, episodeId: episode.id },
      environment: {
        PLAYBACK_SOURCES_JSON: JSON.stringify({
          [`${title.id}/${episode.id}`]: source,
        }),
      },
    }),
    404,
    "episode_unavailable",
  );
});

test("rejects cross-site metadata and foreign or malformed browser origins", async () => {
  assertError(
    await invoke({ headers: { "sec-fetch-site": "cross-site" } }),
    403,
    "cross_origin_request",
  );
  for (const origin of [
    "https://foreign.example",
    "null",
    "not-an-origin",
    "https://foreign.example/path",
  ]) {
    assertError(
      await invoke({ headers: { origin } }),
      403,
      "cross_origin_request",
    );
  }
  assert.equal(
    (
      await invoke({
        sameOrigin: true,
        headers: { "sec-fetch-site": "same-origin" },
      })
    ).status,
    200,
  );
  // No-origin requests remain possible. Origin checks are not access control.
  assert.equal((await invoke()).status, 200);
});

test("validates the deployment origin and forwarded protocol", async () => {
  const configured = { ...environment, APP_ORIGIN: "https://watch.example/" };
  assert.equal(
    (
      await invoke({
        environment: configured,
        headers: { origin: "https://watch.example" },
      })
    ).status,
    200,
  );
  assertError(
    await invoke({ environment: configured, sameOrigin: true }),
    403,
    "cross_origin_request",
  );
  assert.equal(
    (
      await invoke({
        headers: {
          host: "watch.example",
          origin: "https://watch.example",
          "x-forwarded-proto": "https",
        },
      })
    ).status,
    200,
  );
  assertError(
    await invoke({
      headers: {
        host: "watch.example",
        origin: "https://watch.example",
        "x-forwarded-proto": "https,http",
      },
    }),
    403,
    "cross_origin_request",
  );
  assertError(
    await invoke({
      environment: { ...environment, APP_ORIGIN: "https://watch.example/path" },
    }),
    503,
    "playback_configuration_error",
  );
});

test("bounds raw, chunked, and pre-parsed request bodies", async () => {
  const oversized = JSON.stringify({ ...selection, padding: "x".repeat(3000) });
  assertError(
    await invoke({
      raw: oversized,
      headers: { "content-length": String(Buffer.byteLength(oversized)) },
    }),
    413,
    "payload_too_large",
  );
  assertError(
    await invoke({ chunks: [oversized.slice(0, 1200), oversized.slice(1200)] }),
    413,
    "payload_too_large",
  );
  assertError(
    await invoke({ parsedBody: JSON.parse(oversized) }),
    413,
    "payload_too_large",
  );
  assertError(
    await invoke({ parsedBody: oversized }),
    413,
    "payload_too_large",
  );
});

test("fails safely for missing, invalid, or incomplete configuration", async () => {
  assertError(
    await invoke({ environment: {} }),
    503,
    "playback_configuration_error",
  );
  for (const invalid of [
    "broken-json",
    "null",
    "[]",
    '{"wrong-key":"bad-value"}',
  ]) {
    const response = await invoke({
      environment: { PLAYBACK_SOURCES_JSON: invalid },
    });
    assertError(response, 503, "playback_configuration_error");
    assert.ok(!JSON.stringify(response.body).includes(invalid));
  }
  assertError(
    await invoke({ environment: { PLAYBACK_SOURCES_JSON: "{}" } }),
    503,
    "source_unavailable",
  );
});

test("rejects unapproved providers, misleading hostnames, and unsafe URL forms", async () => {
  const invalidSources = [
    "http://player.abyssplayer.com/video",
    "https://example.com/video",
    "https://player.abyssplayer.com.example.com/video",
    "https://sub.player.abyssplayer.com/video",
    "https://player.abyssplayer.com@evil.example/video",
    "https://user:password@player.abyssplayer.com/video",
    "https://player.abyssplayer.com:444/video",
    "https://player.abyssplayer.com/video#secret",
    "https://player.abyssplayer.com/vi\ndeo",
    "javascript:alert(1)",
  ];
  for (const invalid of invalidSources) {
    const response = await invoke({
      environment: {
        PLAYBACK_SOURCES_JSON: JSON.stringify({ [key]: invalid }),
      },
    });
    assertError(response, 503, "playback_configuration_error");
    assert.ok(!JSON.stringify(response.body).includes(invalid));
  }
});
