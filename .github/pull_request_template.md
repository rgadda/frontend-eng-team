<!--
Thanks for contributing to Relay. A good PR is small, focused, and testable.
One role change, one convention edit, or one doc update per PR.
-->

## Summary

<!-- One or two sentences. What changed, and why? -->

## Scope

- [ ] Convention edit (`.agents/conventions.md`)
- [ ] Role contract edit (`.agents/roles/*.md`)
- [ ] Orchestrator change (`.agents/pipeline.md` / `.agents/pipeline-lite.md`)
- [ ] New or edited subagent (`plugins/frontend-team/agents/*.md`)
- [ ] New or edited skill (`plugins/frontend-team/skills/**`)
- [ ] Tooling (CI, bootstrap, metrics)
- [ ] Documentation only

## Checklist

- [ ] Ran `/pipeline <small task>` end-to-end with these changes; output was not degraded
- [ ] `npm ci && npm run lint && npm run build` pass locally
- [ ] If `plugins/frontend-team/**` was touched: bumped `plugin.json#version` and the entry in `.claude-plugin/marketplace.json`
- [ ] If an output format changed: called out explicitly below (breaking change)
- [ ] Docs updated if the file map, role list, or subagent set changed

## Testing notes

<!--
How did you verify? Paste a trimmed log, a before/after diff, or a screenshot.
"Looks fine to me" is not testing.
-->

## Breaking changes

<!--
Anything consumers need to know? Renamed trigger keywords, changed output shape,
removed features, new required fields in memory records.
-->
