---
name: Public npm lockfile URLs
description: Keep package-lock resolved URLs usable outside Replit-hosted installs.
---

Dependency lockfiles used by external deployment providers must not contain Replit-internal package firewall URLs; resolved tarballs should use the public npm registry.

**Why:** External builders such as Vercel cannot resolve `package-firewall.replit.internal`, even though the same lockfile works inside the Replit workspace.

**How to apply:** When a deployment reports an internal package URL or ENOTFOUND error, preserve the locked versions and replace only the internal registry host with `https://registry.npmjs.org/`, then verify with a clean `npm ci` and production build.