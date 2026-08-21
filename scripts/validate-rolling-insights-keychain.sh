#!/bin/zsh

set -euo pipefail

season="${1:-2026}"
date="${2:-$(date +%Y-%m-%d)}"
service="pickrank-rolling-insights-rsc-token"

token="$(security find-generic-password -a "$USER" -s "$service" -w)"
if [[ -z "$token" ]]; then
  print -u2 "Rolling Insights token was not found in the Mac Keychain."
  exit 1
fi

export RSC_TOKEN="$token"
trap 'unset RSC_TOKEN token' EXIT

npm run validate:rolling-insights:read-only -- --season "$season" --date "$date"
