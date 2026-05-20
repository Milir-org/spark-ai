#!/usr/bin/env bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set." >&2
  exit 1
fi

REMOTE_URL="https://milir-ai:${GITHUB_TOKEN}@github.com/Milir-org/spark-ai.git"
BRANCH=$(git --no-optional-locks rev-parse --abbrev-ref HEAD)

echo "Pushing branch '${BRANCH}' to github.com/Milir-org/spark-ai ..."
git push "$REMOTE_URL" "${BRANCH}"
echo "Done. Latest commit: $(git --no-optional-locks log --oneline -1)"
