# npm package version bump

When modifying source code (`src/` or equivalent), the `version` field in `package.json` must be updated before the change is considered complete.

## Procedure

1. After completing source code changes, ask the user which version bump to apply:
   - patch (x.y.Z)
   - minor (x.Y.0)
   - major (X.0.0)
   - prerelease (x.y.z-rc.N, etc.)
2. Update `package.json` `version` according to the user's choice.
3. **Always** run `npm install` immediately after updating `package.json` to sync `package-lock.json`. Never skip this step — a mismatched lockfile will break CI and publish workflows.
