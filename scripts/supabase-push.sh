#!/usr/bin/env bash
# Apply local Supabase migrations to the linked remote project.
# Run once from repo root, after `supabase login`.

set -euo pipefail

PROJECT_REF="yerqsjolpawmbmrjyxhs"

echo "→ Linking to project ${PROJECT_REF}…"
npx --yes supabase link --project-ref "${PROJECT_REF}"

echo "→ Pushing migrations…"
npx --yes supabase db push

echo "✓ Done. Verify in Dashboard → Database → Tables."
