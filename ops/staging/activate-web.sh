#!/usr/bin/env bash
# Run from an uploaded release directory on azao-staging-tencent.
set -euo pipefail
umask 077
project_root=/opt/azao-staging/projects/ruankao
release_dir=$(pwd -P)
case "$release_dir" in
  "$project_root"/releases/staging-*) ;;
  *) echo 'Run this script from a ruankao staging release directory.' >&2; exit 1 ;;
esac
sha256sum -c SHA256SUMS
mkdir -p "$project_root/shared" "$project_root/backups"
chmod 700 "$project_root/shared" "$project_root/backups"
touch "$project_root/shared/runtime.env"
chmod 600 "$project_root/shared/runtime.env"
if test -L "$project_root/current"; then
  readlink "$project_root/current" > "$release_dir/previous-release.txt"
else
  printf 'FIRST_DEPLOYMENT\n' > "$release_dir/previous-release.txt"
fi
docker load -i web-image.tar.gz
docker compose -p ruankao-staging \
  --env-file "$project_root/shared/runtime.env" --env-file release.env \
  -f compose.yml config --quiet
docker compose -p ruankao-staging \
  --env-file "$project_root/shared/runtime.env" --env-file release.env \
  -f compose.yml up -d --wait --wait-timeout 120 --no-build --no-deps web
docker compose -p ruankao-staging --env-file release.env -f compose.yml ps
