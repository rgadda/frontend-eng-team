#!/usr/bin/env bash
# .agents/memory/append.sh
#
# Append one JSONL record to a memory file. Used by every role at end-of-phase
# (and once per RCC iteration). Keeps the write pattern uniform, resolves branch
# and timestamp automatically, and validates the record is single-line JSON.
#
# Usage:
#   .agents/memory/append.sh <file> <phase> <iteration> <status> <summary> \
#     [--task "original task string"] \
#     [--tags "tag1,tag2"] \
#     [--decisions "d1|d2|d3"] \
#     [--questions "q1|q2"] \
#     [--artifact-ref "branch-plan.md@<sha>"] \
#     [--tokens-in <n>] [--tokens-out <n>]
#
# Files are created if missing. Records are appended, never rewritten in place.
# See .agents/memory/schema.md for field definitions.

set -euo pipefail

if [ "$#" -lt 5 ]; then
  echo "usage: $0 <file> <phase> <iteration> <status> <summary> [--task ...] [--tags ...] [--decisions ...] [--questions ...] [--artifact-ref ...] [--tokens-in n] [--tokens-out n]" >&2
  exit 64
fi

FILE="$1"; shift
PHASE="$1"; shift
ITER="$1"; shift
STATUS="$1"; shift
SUMMARY="$1"; shift

TASK=""
TAGS=""
DECISIONS=""
QUESTIONS=""
ARTIFACT_REF=""
TOK_IN=""
TOK_OUT=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --task) TASK="$2"; shift 2 ;;
    --tags) TAGS="$2"; shift 2 ;;
    --decisions) DECISIONS="$2"; shift 2 ;;
    --questions) QUESTIONS="$2"; shift 2 ;;
    --artifact-ref) ARTIFACT_REF="$2"; shift 2 ;;
    --tokens-in) TOK_IN="$2"; shift 2 ;;
    --tokens-out) TOK_OUT="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 64 ;;
  esac
done

MEM_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$MEM_DIR/$FILE"

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")"

# Stable task_id: sha256 of lowercased, whitespace-collapsed task string.
if [ -n "$TASK" ]; then
  NORM_TASK="$(printf '%s' "$TASK" | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ')"
  if command -v shasum >/dev/null 2>&1; then
    TASK_ID="sha256:$(printf '%s' "$NORM_TASK" | shasum -a 256 | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    TASK_ID="sha256:$(printf '%s' "$NORM_TASK" | sha256sum | awk '{print $1}')"
  else
    TASK_ID="sha256:unavailable"
  fi
else
  TASK_ID=""
fi

# JSON-escape a string: backslashes, quotes, control chars, then newlines to \n.
json_escape() {
  local s=$1
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  # shellcheck disable=SC1003
  s=${s//$'\t'/\\t}
  s=${s//$'\r'/\\r}
  s=${s//$'\n'/\\n}
  printf '%s' "$s"
}

# Convert a pipe-delimited string to a JSON string array.
pipe_to_json_array() {
  local raw=$1
  if [ -z "$raw" ]; then
    printf '[]'
    return
  fi
  local first=1
  printf '['
  IFS='|' read -r -a parts <<< "$raw"
  for p in "${parts[@]}"; do
    if [ $first -eq 0 ]; then printf ','; fi
    printf '"%s"' "$(json_escape "$p")"
    first=0
  done
  printf ']'
}

# Convert a comma-delimited string to a JSON string array (used for tags).
csv_to_json_array() {
  local raw=$1
  if [ -z "$raw" ]; then
    printf '[]'
    return
  fi
  local first=1
  printf '['
  IFS=',' read -r -a parts <<< "$raw"
  for p in "${parts[@]}"; do
    # trim whitespace
    p="${p#"${p%%[![:space:]]*}"}"
    p="${p%"${p##*[![:space:]]}"}"
    if [ $first -eq 0 ]; then printf ','; fi
    printf '"%s"' "$(json_escape "$p")"
    first=0
  done
  printf ']'
}

DECISIONS_JSON="$(pipe_to_json_array "$DECISIONS")"
QUESTIONS_JSON="$(pipe_to_json_array "$QUESTIONS")"
TAGS_JSON="$(csv_to_json_array "$TAGS")"

ESC_SUMMARY="$(json_escape "$SUMMARY")"
ESC_BRANCH="$(json_escape "$BRANCH")"
ESC_PHASE="$(json_escape "$PHASE")"
ESC_STATUS="$(json_escape "$STATUS")"
ESC_ARTIFACT="$(json_escape "$ARTIFACT_REF")"

# Numeric fields — default to null when unset.
tok_in_field="null"; [ -n "$TOK_IN" ] && tok_in_field="$TOK_IN"
tok_out_field="null"; [ -n "$TOK_OUT" ] && tok_out_field="$TOK_OUT"

# Build the record on a single line. Order matches schema.md for grep-friendliness.
RECORD=$(printf '{"ts":"%s","branch":"%s","task_id":"%s","phase":"%s","iteration":%s,"status":"%s","summary":"%s","key_decisions":%s,"open_questions":%s,"tags":%s,"artifact_ref":"%s","tokens_in":%s,"tokens_out":%s}' \
  "$TS" "$ESC_BRANCH" "$TASK_ID" "$ESC_PHASE" "$ITER" "$ESC_STATUS" "$ESC_SUMMARY" \
  "$DECISIONS_JSON" "$QUESTIONS_JSON" "$TAGS_JSON" "$ESC_ARTIFACT" "$tok_in_field" "$tok_out_field")

# Sanity check: record must be a single line.
case "$RECORD" in
  *$'\n'*) echo "append.sh: record contains newline; refusing to append" >&2; exit 65 ;;
esac

# Optional JSON syntax check if a validator is present. Non-fatal if missing.
if command -v python3 >/dev/null 2>&1; then
  if ! printf '%s' "$RECORD" | python3 -c 'import json,sys; json.loads(sys.stdin.read())' >/dev/null 2>&1; then
    echo "append.sh: record is not valid JSON; refusing to append" >&2
    exit 65
  fi
fi

mkdir -p "$MEM_DIR"
printf '%s\n' "$RECORD" >> "$TARGET"
