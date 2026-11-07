# Security Policy

## Supported versions

Relay is currently a template framework — security fixes apply to the `main` branch. Users who have bootstrapped the pipeline into their own repos should pull updates from `main` when a fix lands.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Use GitHub's [private vulnerability reporting](https://github.com/rgadda/frontend-eng-team/security/advisories/new) to send a report. Include:

- A description of the vulnerability and its impact.
- Steps to reproduce (minimal example preferred).
- Affected files or roles.
- Any suggested mitigation.

You should receive an acknowledgment within **72 hours**. We will keep you informed as we investigate and work on a fix.

## Scope

In scope:

- The role contracts in `.agents/` (prompt injection vectors, role escape, unsafe default behavior).
- The plugin assets in `plugins/frontend-team/` (subagent output handling, skill content).
- The bootstrap script `scripts/ft-bootstrap.sh` (file system manipulation, permission allowlist generation).
- The PR metrics script `scripts/collect-pr-metrics.ts` (token handling, GitHub API misuse).

Out of scope:

- Vulnerabilities in third-party dependencies (please report directly to the dependency maintainer).
- Vulnerabilities in Claude Code itself, Anthropic's API, or any LLM provider — report to the respective vendor.
- Vulnerabilities in generated application code that the pipeline produces — those are the responsibility of the consuming repository.

## What to expect

- We take all reports seriously, even if they turn out to be non-issues.
- We will not pursue legal action against researchers acting in good faith.
- Credit in release notes if you'd like it (opt-in).
