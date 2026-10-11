#!/usr/bin/env bash
# First-time host integration. The caller must authorize the shared-proxy restart.
# App updates with the same alias need activate-web.sh only.
set -euo pipefail
umask 077
project_root=/opt/azao-staging/projects/ruankao
release_dir=$(pwd -P)
case "$release_dir" in
  "$project_root"/releases/staging-*) ;;
  *) echo 'Run from a ruankao staging release directory.' >&2; exit 1 ;;
esac
proxy=azao-staging-proxy-1
edge=ruankao-staging_edge
proxy_source=$(docker inspect "$proxy" --format '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}')
test -n "$proxy_source"
backup_dir="$project_root/shared/proxy-backups"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
backup="$backup_dir/Caddyfile.$(date -u +%Y%m%dT%H%M%SZ).before"
sudo -n cat "$proxy_source" > "$backup"
chmod 600 "$backup"
before_sha=$(sha256sum "$backup" | awk '{print $1}')
if rg_found=$(grep -F 'ruankao.staging.haaboo.com' "$backup"); then
  echo 'Host already configured; inspect it before changing the shared proxy.' >&2
  exit 1
fi
candidate="$release_dir/Caddyfile.candidate"
cat "$backup" > "$candidate"
printf '\n' >> "$candidate"
cat "$release_dir/Caddyfile.proxy-site" >> "$candidate"
diff -u "$backup" "$candidate" || test "$?" -eq 1
docker cp "$candidate" "$proxy:/tmp/ruankao-Caddyfile.candidate"
docker exec "$proxy" caddy validate --config /tmp/ruankao-Caddyfile.candidate --adapter caddyfile

if ! docker inspect "$proxy" --format '{{json .NetworkSettings.Networks}}' | grep -Fq "\"$edge\""; then
  docker network connect "$edge" "$proxy"
fi
docker exec "$proxy" wget -q -O - http://ruankao-staging-web:8080/healthz
# Avoid overwriting another deployment's concurrent changes.
current_sha=$(sudo -n sha256sum "$proxy_source" | awk '{print $1}')
test "$current_sha" = "$before_sha"
printf '%s\n' "$proxy_source" > "$release_dir/proxy-source-path.txt"
printf '%s\n' "$backup" > "$release_dir/proxy-backup-path.txt"

restore_proxy() {
  trap - ERR
  sudo -n tee "$proxy_source" < "$backup" > /dev/null
  docker exec "$proxy" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  docker restart "$proxy"
  echo "Restored shared proxy from $backup" >&2
}
trap restore_proxy ERR
# Preserve the inode of this single-file bind mount.
sudo -n tee "$proxy_source" < "$candidate" > /dev/null
host_sha=$(sudo -n sha256sum "$proxy_source" | awk '{print $1}')
container_sha=$(docker exec "$proxy" sha256sum /etc/caddy/Caddyfile | awk '{print $1}')
test "$host_sha" = "$container_sha"
docker exec "$proxy" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker restart "$proxy"
for route in / /judgment/ /api/judgment/bootstrap; do
  curl --retry 5 --retry-connrefused --retry-delay 1 --max-time 15 -fsS \
    -o /dev/null "https://staging.haaboo.com$route"
done
trap - ERR
docker exec "$proxy" rm -f /tmp/ruankao-Caddyfile.candidate
printf 'Proxy integrated. Backup: %s\nNetwork connection: %s -> %s\n' "$backup" "$proxy" "$edge"
