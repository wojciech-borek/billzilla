# E2E Testing Guide

## Visual Regression Tests

### Platform-Specific Snapshots

Visual regression tests create snapshots that are platform-specific. We maintain separate snapshots for:

- **Windows** (local development): `*-win32.png`
- **Linux** (CI/CD): `*-linux.png`

This ensures consistent visual comparisons across different environments.

### Updating Snapshots

When visual changes are intentional (e.g., UI updates, new features), update snapshots locally first:

```bash
# Update all visual regression snapshots for your platform
npm run test:e2e:update-snapshots

# Or update specific test
npx playwright test e2e/unauthenticated.spec.ts --update-snapshots
```

**Important**: Always review the updated snapshots before committing to ensure changes are expected.

### Cross-Platform Compatibility

Due to differences in:

- Font rendering between Windows/Linux
- System fonts availability
- Antialiasing and rendering engines

We maintain separate snapshots for each platform. The `unauthenticated-chromium` project uses `snapshotPathTemplate` for consistent naming within each platform.

### CI/CD Behavior

- Tests automatically use platform-appropriate snapshots
- CI installs additional system fonts (`fonts-liberation`, `fonts-noto-*`) for better consistency
- Higher tolerance (2% vs 1% pixel difference) is used in CI to account for minor rendering variations
- Fixed viewport size (1280x720) ensures consistent screenshot dimensions

### Workflow for Visual Changes

1. **Make your UI changes** in the codebase
2. **Run tests locally** to see if visual regression tests pass
3. **If tests fail** and changes are expected:
   - Update snapshots: `npm run test:e2e:update-snapshots`
   - Review the new snapshots visually
   - Commit both code and snapshot changes
4. **Push and create PR** - CI will verify snapshots work in Linux environment
5. **If CI fails** due to platform differences:
   - You may need to run tests in CI environment or adjust tolerance
   - Consider if the visual differences are acceptable

### Troubleshooting

**"Snapshot doesn't exist" error**:

- Check if snapshots exist for your platform (`*-win32.png` for Windows, `*-linux.png` for Linux)
- Run `npm run test:e2e:update-snapshots` to generate missing snapshots

**Visual differences between local and CI**:

- Font rendering differences are normal
- Check if UI changes are truly needed vs platform-specific rendering artifacts
- Adjust `maxDiffPixelRatio` if needed (currently 2% in CI, 1% locally)

**Large visual differences**:

- Verify viewport sizes are consistent (1280x720)
- Check for missing fonts or CSS issues
- Consider if the change affects layout significantly
