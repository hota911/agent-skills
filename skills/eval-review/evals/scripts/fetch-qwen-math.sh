#!/bin/bash
# Download MATH Lvl-5 per-sample logs (7 subjects) for Qwen2.5-7B and
# Qwen2.5-7B-Instruct from the gated Open LLM Leaderboard v2 details datasets
# (about 18.5 MB total). Used by eval id 9 in ../evals.json. Do not commit the data.
# Requires HF_TOKEN (a read token from https://huggingface.co/settings/tokens) for
# an account that has accepted the datasets' terms.
#
# Usage: fetch-qwen-math.sh <output-dir>
set -euo pipefail

: "${HF_TOKEN:?Set HF_TOKEN first}"
if [ $# -ne 1 ]; then
  echo "Usage: $0 <output-dir>" >&2
  exit 2
fi
OUT=$1
SUBJECTS="algebra_hard counting_and_prob_hard geometry_hard intermediate_algebra_hard num_theory_hard prealgebra_hard precalculus_hard"

fetch() {
  local repo=$1 folder=$2 ts=$3 dest=$OUT/$2
  mkdir -p "$dest"
  for s in $SUBJECTS; do
    local f="samples_leaderboard_math_${s}_${ts}.jsonl"
    curl -fsSL -H "Authorization: Bearer $HF_TOKEN" -o "$dest/$f" \
      "https://huggingface.co/datasets/open-llm-leaderboard/$repo/resolve/main/$folder/$f"
    echo "ok $folder/$f"
  done
}

fetch Qwen__Qwen2.5-7B-details Qwen__Qwen2.5-7B 2024-09-19T20-06-18.725496
fetch Qwen__Qwen2.5-7B-Instruct-details Qwen__Qwen2.5-7B-Instruct 2024-09-19T16-21-01.446061
du -sh "$OUT"
