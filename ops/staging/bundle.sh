#!/usr/bin/env bash
set -euo pipefail
umask 077

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
build_stamp=$(date -u +%Y%m%dT%H%M%SZ)
candidate_dir="$repo_root/tmp/staging/candidate-$build_stamp"
source_dir="$candidate_dir/source"
mkdir -p "$source_dir"

# Explicit source allowlist: never archive the whole dirty checkout, credentials,
# node_modules, previous releases, or the Sites publishing workspace.
for path in .gitignore .dockerignore LICENSE README.md README-Codex.md \
  content-import-report.md package.json package-lock.json tsconfig.json index.html \
  vite.config.ts playwright.config.ts playwright.production.config.ts \
  playwright.staging.config.ts playwright.audit.config.ts src public scripts materials ops tests; do
  cp -R "$repo_root/$path" "$source_dir/$path"
done
mkdir -p "$source_dir/docs/screenshots"
tar -czf "$candidate_dir/source.tar.gz" -C "$source_dir" .
source_sha256=$(shasum -a 256 "$candidate_dir/source.tar.gz" | awk '{print $1}')
release_id="staging-$build_stamp-${source_sha256:0:12}"
bundle_dir="$repo_root/tmp/staging/releases/$release_id"
web_image="ruankao-web:$release_id"
mkdir -p "$bundle_dir"
cp "$candidate_dir/source.tar.gz" "$bundle_dir/source.tar.gz"

cd "$source_dir"
npm ci --no-audit --no-fund
npm run test
BASE_PATH=/ VITE_ROUTER_MODE=browser npm run build
docker buildx build --platform linux/amd64 --load \
  -f ops/staging/Dockerfile.web -t "$web_image" .
docker image inspect "$web_image" --format '{{.Os}}/{{.Architecture}}' \
  | tee "$bundle_dir/image-platform.txt"
test "$(cat "$bundle_dir/image-platform.txt")" = "linux/amd64"
docker save "$web_image" | gzip > "$bundle_dir/web-image.tar.gz"
cp ops/staging/compose.yml ops/staging/Caddyfile.proxy-site \
  ops/staging/activate-web.sh ops/staging/connect-proxy.sh "$bundle_dir/"
printf 'STAGING_WEB_IMAGE=%s\n' "$web_image" > "$bundle_dir/release.env"
printf 'release_id=%s\nsource_sha256=%s\nbase_git_commit=%s\nsource_is_uncommitted_snapshot=true\nimage_id=%s\npublic_url=https://ruankao.staging.haaboo.com\n' \
  "$release_id" "$source_sha256" "$(git -C "$repo_root" rev-parse HEAD)" \
  "$(docker image inspect "$web_image" --format '{{.Id}}')" > "$bundle_dir/manifest.txt"
(cd "$bundle_dir" && shasum -a 256 source.tar.gz web-image.tar.gz compose.yml \
  Caddyfile.proxy-site activate-web.sh connect-proxy.sh release.env \
  image-platform.txt manifest.txt > SHA256SUMS)
printf '%s\n' "$bundle_dir" > "$repo_root/tmp/staging/latest-bundle-path"
printf '%s\n' "$source_dir" > "$repo_root/tmp/staging/latest-source-path"
printf 'Prepared release: %s\nBundle: %s\nSource: %s\n' "$release_id" "$bundle_dir" "$source_dir"
