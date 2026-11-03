import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRouteUrl } from "../src/routing.ts";

test("pasted category routes keep their category with trailing slashes", () => {
  for (const category of ["movies", "anime", "catalog"]) {
    for (const suffix of ["", "/", "///"]) {
      const route = normalizeRouteUrl(
        new URL(`https://example.com/${category}${suffix}`),
      );
      assert.equal(route.pathname, `/${category}`);
    }
  }
});

test("normalizing routes preserves filters, fragments, and encoded identifiers", () => {
  const original = new URL(
    "https://example.com//title/encoded%2Fid///?season=season-2&available=1#episodes",
  );
  const route = normalizeRouteUrl(original);
  assert.equal(route.pathname, "/title/encoded%2Fid");
  assert.equal(route.search, original.search);
  assert.equal(route.hash, "#episodes");
  assert.equal(original.pathname, "//title/encoded%2Fid///");
});

test("root routes stay at root and normalization is stable", () => {
  const root = normalizeRouteUrl(new URL("https://example.com////?search=1"));
  assert.equal(root.pathname, "/");
  assert.equal(root.search, "?search=1");
  assert.equal(normalizeRouteUrl(root).href, root.href);
});
