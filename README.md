# GitHub Copilot OpenCode OAuth Plugin for OMP

This plugin overrides OMP's built-in `github-copilot` provider so GitHub Copilot uses the OpenCode OAuth app instead of VSCode-extension impersonation.

It keeps the normal `github-copilot/<model>` model names, reuses OMP's Copilot request shaping and billing headers, and stores a direct GitHub OAuth token for all Copilot API calls.

## What It Changes

- Replaces the built-in GitHub Copilot transport with an override that still uses OMP's exported Copilot provider helpers.
- Uses the OpenCode OAuth app client ID `Ov23li8tweQw6odWQebz`.
- Uses direct GitHub OAuth bearer tokens against `https://api.githubcopilot.com`.
- Preserves the standard `github-copilot/*` model IDs instead of introducing a parallel provider namespace.
- Preserves the Copilot request-shaping path that controls headers like `X-Initiator` and premium-request accounting.

## Install

Supported upstream install path once the package is published:

```bash
omp plugin install omp-github-copilot-opencode
```

Local development fallback:

```bash
git clone https://github.com/inprealpha/omp-github-copilot-opencode.git
cd omp-github-copilot-opencode
bun install
omp plugin link "$PWD"
```

If OMP is already running, reload extensions once:

```text
/reload-plugins
```

## Login

After the plugin is installed, use this inside OMP interactive mode:

```text
/copilot-opencode-login
```

Optional enterprise host/domain:

```text
/copilot-opencode-login ghe.example.com
```

The plugin intentionally uses its own explicit command instead of intercepting OMP's built-in `/login github-copilot` flow. Successful login still writes credentials into the standard `github-copilot` auth slot.

If you previously authenticated GitHub Copilot with the legacy flow, re-run `/copilot-opencode-login` once after installing this plugin.

## Use

Keep using the normal built-in models:

```text
/model github-copilot/gpt-5
/model github-copilot/claude-sonnet-4
```

Nothing changes in the provider name. The plugin only replaces how authentication and transport are resolved.

## Logout

```text
/copilot-opencode-logout
```

Or use OMP's regular logout flow for `github-copilot`.

## Verification

Run the package check locally:

```bash
bun run check
```

## Publish

This repo is intended to be published to npm so upstream OMP can install it through `omp plugin install`.

Manual publish:

```bash
bun publish
```

GitHub Actions publish:

- Set the `NPM_TOKEN` repository secret.
- Run the `publish` workflow manually or publish a GitHub release.

## Notes

- The supported login path is `/copilot-opencode-login`. OMP's built-in `/login github-copilot` still runs the core flow and is intentionally not intercepted by this plugin.
- Upstream OMP does not currently load `omp.extensions` from marketplace-installed repo caches, so marketplace installation is intentionally not used for this plugin.
- If you installed an older marketplace build of this repo, remove it with `omp plugin uninstall omp-github-copilot-opencode@omp-github-copilot-opencode` and reinstall via package install or local link.
- This plugin depends on the exported `@oh-my-pi/pi-ai` helpers instead of copying Copilot request-shaping code, so future upstream transport changes are easier to inherit by updating the dependency.
