import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const project = fileURLToPath(new URL("../", import.meta.url));

async function invokeCompiledFunction(directory) {
  const { getEpisodes, isPlayable, titles } = await import(
    pathToFileURL(join(directory, "src/data.js")).href
  );
  const selections = titles.flatMap((title) =>
    getEpisodes(title)
      .filter(isPlayable)
      .map((episode) => ({ titleId: title.id, episodeId: episode.id })),
  );
  const sources = Object.fromEntries(
    selections.map(({ titleId, episodeId }) => [
      `${titleId}/${episodeId}`,
      `https://player.abyssplayer.com/test/${titleId}/${episodeId}`,
    ]),
  );
  // This subprocess uses only dummy configuration, never real playback values.
  process.env.PLAYBACK_SOURCES_JSON = JSON.stringify(sources);
  delete process.env.APP_ORIGIN;
  const { default: handler } = await import(
    pathToFileURL(join(directory, "api/playback.js")).href
  );
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  const endpoint = `${origin}/api/playback`;
  try {
    const methodResponse = await fetch(endpoint);
    assert.equal(methodResponse.status, 405);
    assert.equal((await methodResponse.json()).code, "method_not_allowed");
    for (const selection of selections) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          "Sec-Fetch-Site": "same-origin",
        },
        body: JSON.stringify(selection),
      });
      const key = `${selection.titleId}/${selection.episodeId}`;
      assert.equal(response.status, 200, key);
      assert.equal((await response.json()).source, sources[key], key);
    }
    console.log(
      `Compiled API checks passed: plain Node.js startup, GET rejection, and ${selections.length} playable selections.`,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

async function verifyFunction() {
  const configPath = join(project, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  // Vercel reads the root compiler options; it does not use project references.
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, project);
  const directory = await mkdtemp(join(tmpdir(), "animestreamx-function-"));
  try {
    const program = ts.createProgram([join(project, "api/playback.ts")], {
      ...parsed.options,
      rootDir: project,
      outDir: directory,
      noEmit: false,
      noEmitOnError: true,
      declaration: false,
      sourceMap: false,
    });
    const emitted = program.emit();
    const errors = [...parsed.errors, ...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics]
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length || emitted.emitSkipped) {
      const formatHost = {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => project,
        getNewLine: () => "\n",
      };
      throw new Error(`Vercel API compilation failed:\n${ts.formatDiagnostics(errors, formatHost)}`);
    }
    await writeFile(join(directory, "package.json"), '{"type":"module"}\n');
    const environment = { ...process.env };
    delete environment.NODE_OPTIONS;
    delete environment.PLAYBACK_SOURCES_JSON;
    delete environment.APP_ORIGIN;
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "--invoke-compiled", directory],
      { env: environment, stdio: "inherit", timeout: 30000 },
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, "The compiled Vercel API must run without a TypeScript loader");
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith("animestreamx-function-"));
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[2] === "--invoke-compiled") {
  await invokeCompiledFunction(process.argv[3]);
} else {
  await verifyFunction();
}
