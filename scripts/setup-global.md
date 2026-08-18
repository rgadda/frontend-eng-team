# Setting up the frontend-team pipeline globally

The pipeline has two independent parts, and they live in different places on
purpose:

| Part | What it contains | Scope |
|---|---|---|
| **Plugin** | Subagents (`repo-explorer`, `frontend-reviewer`, `test-runner`, `prod-readiness`, `verifier`) + skills (`component-conventions`, `pr-prep`, `pm-clarify`, `loop-engineering`) | Can be enabled **globally**, once per machine |
| **Pipeline scaffolding** | Role contracts (`.agents/roles/`), slash commands (`.claude/commands/`), memory helper (`.agents/memory/`) | Must live **per-repo** — slash commands read the role files at repo-relative paths, and JSONL memory is branch-scoped |

You do the plugin install once. You run a bootstrap script once per new repo.

---

## Prerequisites

- Claude Code CLI installed and working
- The `frontend-eng-team` repo cloned somewhere on disk (e.g. `~/code/frontend-eng-team`)
- A shell (`bash` or `zsh` — the bootstrap script is bash)
- `git`, `python3` (for path resolution on macOS)

---

## Step 1 — Install the plugin globally (once per machine)

Rather than hand-editing `~/.claude/settings.json` and guessing at the schema,
let Claude Code write the settings itself. From any directory, run:

```bash
# Register the marketplace at the user scope so every repo picks it up
claude plugin marketplace add <your-owner>/frontend-eng-team --scope user

# Install the plugin at the user scope
claude plugin install frontend-team@frontend-team-marketplace --scope user
```

Replace `<your-owner>/frontend-eng-team` with the GitHub owner + repo where you
published this. If you're developing against a local checkout, use a local path
instead of a GitHub reference:

```bash
claude plugin marketplace add ~/code/frontend-eng-team --scope user
```

To pin a specific version instead of tracking the latest:

```bash
claude plugin install frontend-team@frontend-team-marketplace@0.2.0 --scope user
```

### Verify

Open Claude Code in any directory and run:

```
/plugin list
```

You should see `frontend-team` enabled. Then:

```
/agents
```

You should see: `repo-explorer`, `frontend-reviewer`, `test-runner`,
`prod-readiness`, `verifier`.

---

## Step 2 — Install the bootstrap script (once per machine)

The bootstrap script (`scripts/ft-bootstrap.sh`) copies the pipeline scaffolding
into a target repo. Symlink it onto your `PATH` so you can run it from anywhere
as `ft-bootstrap`:

```bash
mkdir -p ~/bin
ln -s ~/code/frontend-eng-team/scripts/ft-bootstrap.sh ~/bin/ft-bootstrap
```

Make sure `~/bin` is on your `PATH`. If not, add this to your shell rc
(`~/.zshrc` or `~/.bashrc`):

```bash
export PATH="$HOME/bin:$PATH"
```

Reload your shell:

```bash
exec $SHELL
```

Sanity check:

```bash
which ft-bootstrap
# → /Users/<you>/bin/ft-bootstrap
```

If your team repo lives somewhere other than `~/code/frontend-eng-team`, you
can either symlink from that actual path, or set `FT_TEAM_REPO` in your shell
rc so the script always finds it:

```bash
export FT_TEAM_REPO="/actual/path/to/frontend-eng-team"
```

---

## Step 3 — Install pipeline scaffolding in a project (once per repo)

Every time you want to use the pipeline in a repo you haven't set it up in yet:

```bash
cd /path/to/some-frontend-project
ft-bootstrap
```

The script:
- Copies `.agents/roles/`, `.agents/pipeline.md`, `.agents/memory/schema.md`,
  `.agents/memory/append.sh` into the repo
- Copies `.claude/commands/*.md` (slash commands)
- Copies `AGENTS.md` (if not already customized)
- Appends `branch-plan.md`, `branch-prd.md`, `.agents/memory/*.jsonl` to
  `.gitignore` (dedupe-safe)
- Creates `.claude/settings.local.json` with an allowlist for the memory helper
  (so JSONL appends don't trigger a permission prompt every phase)

It's **idempotent** — safe to re-run any time. Your per-branch JSONL memory
(`.agents/memory/*.jsonl`) is not touched.

### Verify

In Claude Code, inside the target repo:

```
/context
```

The workspace-context step should list `.agents/roles/pm.md`,
`.agents/roles/architect.md`, and the others. Try a small task:

```
/pipeline Update the copy on the empty-state banner in <some-feature>
```

You should see the task classification block, then the Architect run.

---

## Step 4 — When the team repo updates (repeat as needed)

Whenever the team ships new role contracts, updated slash commands, or a new
plugin version:

```bash
# Pull the latest team contracts
cd ~/code/frontend-eng-team
git pull

# Re-install the plugin at the new version (skip if you don't pin versions)
claude plugin install frontend-team@frontend-team-marketplace@<new-version> --scope user

# Re-run bootstrap in each repo you want to update
cd /path/to/some-frontend-project
ft-bootstrap
```

Bootstrap will overwrite the role contracts and slash commands (that's the
point — team updates propagate). It preserves your JSONL memory and warns
instead of clobbering a customized `AGENTS.md`.

---

## Troubleshooting

**`/plugin list` doesn't show frontend-team**
- Re-check the marketplace registration: `claude plugin marketplace list`
- If the marketplace is missing, re-run the `marketplace add` command from Step 1
- If the marketplace is present but the plugin isn't, re-run the `install` command

**`/architect` fails with "cannot find .agents/roles/architect.md"**
- The pipeline scaffolding isn't installed in this repo. Run `ft-bootstrap` from
  the repo root.

**`ft-bootstrap: cannot find frontend-team repo at ...`**
- The script couldn't auto-locate the team repo. Set the env var:
  `FT_TEAM_REPO=/actual/path/to/frontend-eng-team ft-bootstrap`

**Memory helper triggers a permission prompt every phase**
- `.claude/settings.local.json` doesn't have the allowlist. Delete the file and
  re-run `ft-bootstrap` (it'll re-create it), or add these lines manually to
  `permissions.allow`:
  ```json
  "Bash(.agents/memory/append.sh:*)",
  "Bash(grep:*.agents/memory/*)"
  ```

**Bootstrap warned about a customized `AGENTS.md` and skipped it**
- Intentional — you (or the target repo) had a modified `AGENTS.md`. Compare
  with the team version to decide what to keep:
  ```bash
  diff AGENTS.md ~/code/frontend-eng-team/AGENTS.md
  ```

---

## What you do NOT need to do

- ❌ Hand-edit `~/.claude/settings.json` — Step 1's CLI commands do it for you
- ❌ Copy `plugins/frontend-team/` into every repo — the plugin runs globally
- ❌ Commit `.agents/memory/*.jsonl` — they're personal workspace, gitignored
- ❌ Delete `branch-plan.md` and `branch-prd.md` manually after PR — they're
  gitignored and only meaningful mid-branch
