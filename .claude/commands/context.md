# Persistent workspace context

This command seeds the session with the repository's canonical static docs.
Run it once when the Claude session starts or after the workspace is reloaded.

Use these files as the persistent source of truth:
- `CLAUDE.md`
- `AGENTS.md`
- `.agents/pipeline.md`
- `.agents/roles/pm.md`
- `.agents/roles/architect.md`
- `.agents/roles/implementer.md`
- `.agents/roles/reviewer.md`
- `.agents/roles/prod-readiness.md`
- `.agents/roles/verifier.md`
- `.agents/memory/schema.md`

After running this command, later phase prompts should be lightweight:
- “Use stored project rules from `CLAUDE.md`.”
- “Use stored workflow contracts from `.agents/pipeline.md` and `.agents/roles/*.md`.”
- “Read `branch-prd.md` for the approved PRD (feature work only).”
- “Read `branch-plan.md` for the current plan.”
- “Load prior-phase summaries from `.agents/memory/*.jsonl` before opening full artifacts.”
- “Do not resend the full text of these static docs after the initial load.”

This command is a prompt-seeding helper, not a workflow phase itself.
