# Spinner Release Process

Spinner uses pull-request validation, protected `main`, GitHub Pages deployment, and semantic release tags that mirror the product release number.

## Version convention

- Product release `VN` uses package version `N.0.0` and Git tag `vN.0.0`.
- A release tag points at the validated `main` commit that contains the published product version.
- Patch-only release corrections use `vN.0.1`, `vN.0.2`, and so on without changing the product-layer name.
- A product version is not tagged until its pull request, post-merge `main` validation, and Pages deployment are green.

## Required release flow

1. Create a focused branch. Codex-owned branches use the `codex/` prefix.
2. Add or update deterministic unit, content, and Chromium coverage with the implementation.
3. Run `npm run validate:release`, `npm audit`, a credential-pattern scan, and `git diff --check` locally.
4. Open a pull request against `main` and wait for both required checks:
   - `Unit and content validation`
   - `Chromium release journeys`
5. Squash-merge only after required checks are green and the branch is current with `main`.
6. Confirm the post-merge `main` validation and GitHub Pages deployment both succeed.
7. Verify the live site responds successfully and advertises the intended release.
8. Create the matching GitHub release and tag with an accurate change summary and validation record.
9. Delete the merged feature branch. GitHub is configured to do this automatically.

Required checks must not be bypassed to publish a release. If CI fails, use the first meaningful failing assertion or job log as evidence and fix the proven defect.

## Security and dependency policy

- GitHub secret scanning and push protection remain enabled.
- Dependabot vulnerability alerts, security updates, and weekly npm version updates remain enabled.
- Dependency pull requests use the same required validation checks as feature work.
- Secrets and credentials must not be committed. Runtime configuration must use environment variables when configuration is ever required.

## Rollback

If a published commit is defective, create a focused revert pull request, run the complete required checks, merge the revert, and verify the Pages deployment. Do not rewrite `main`, force-push a release tag, or silently replace published release assets.
