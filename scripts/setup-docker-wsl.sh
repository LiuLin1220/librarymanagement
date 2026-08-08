#!/usr/bin/env sh

set -eu

DOCKER_PROXY_URL=${DOCKER_PROXY_URL:-http://127.0.0.1:12334}
DOCKER_KEY_FINGERPRINT=9DC858229FC7DD38854AE2D88D81803C0EBFCD88
DOCKER_KEY=/etc/apt/keyrings/docker.asc
DOCKER_SOURCE=/etc/apt/sources.list.d/docker.sources
DOCKER_PROXY_DROP_IN=/etc/systemd/system/docker.service.d/http-proxy.conf
SOURCE_TEMP=''
PROXY_TEMP=''

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  if [ -n "$SOURCE_TEMP" ]; then
    rm -f -- "$SOURCE_TEMP"
  fi
  if [ -n "$PROXY_TEMP" ]; then
    rm -f -- "$PROXY_TEMP"
  fi
}

trap cleanup EXIT HUP INT TERM

case "$DOCKER_PROXY_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) fail 'DOCKER_PROXY_URL must be a loopback HTTP proxy without credentials.' ;;
esac

if ! grep -qi microsoft /proc/sys/kernel/osrelease; then
  fail 'This installer only supports Ubuntu running under WSL 2.'
fi

# shellcheck disable=SC1091
. /etc/os-release
if [ "${ID:-}" != 'ubuntu' ]; then
  fail 'This installer only supports Ubuntu.'
fi
case "${VERSION_CODENAME:-}" in
  jammy|noble|questing|resolute) ;;
  *) fail "Unsupported Ubuntu release: ${VERSION_CODENAME:-unknown}" ;;
esac

if [ "$(dpkg --print-architecture)" != 'amd64' ]; then
  fail 'This repository installer currently supports amd64 only.'
fi
if ! sudo -n true 2>/dev/null; then
  fail 'Passwordless sudo is required for the non-interactive WSL setup.'
fi
if [ "$(ps -p 1 -o comm=)" != 'systemd' ]; then
  fail 'systemd must be PID 1 in WSL.'
fi

if ! curl --proxy "$DOCKER_PROXY_URL" --fail --silent --show-error \
  --output /dev/null --connect-timeout 10 --max-time 30 \
  "https://download.docker.com/linux/ubuntu/dists/${VERSION_CODENAME}/InRelease"; then
  fail "Docker repository is not reachable through $DOCKER_PROXY_URL."
fi

conflicts=''
for package_name in \
  docker.io \
  docker-compose \
  docker-compose-v2 \
  docker-doc \
  docker-buildx \
  podman-docker \
  containerd \
  runc; do
  package_status=$(dpkg-query -W -f='${db:Status-Abbrev}' "$package_name" 2>/dev/null || true)
  case "$package_status" in
    ii*) conflicts="$conflicts $package_name" ;;
  esac
done
if [ -n "$conflicts" ]; then
  fail "Conflicting packages are installed:$conflicts"
fi

proxy_command() {
  sudo -n env \
    HTTP_PROXY="$DOCKER_PROXY_URL" \
    HTTPS_PROXY="$DOCKER_PROXY_URL" \
    NO_PROXY='localhost,127.0.0.1,::1' \
    http_proxy="$DOCKER_PROXY_URL" \
    https_proxy="$DOCKER_PROXY_URL" \
    no_proxy='localhost,127.0.0.1,::1' \
    "$@"
}

proxy_command apt-get update
proxy_command apt-get install --yes ca-certificates curl gnupg
sudo -n install -m 0755 -d /etc/apt/keyrings

if [ ! -f "$DOCKER_KEY" ]; then
  proxy_command curl --fail --silent --show-error --location \
    https://download.docker.com/linux/ubuntu/gpg --output "$DOCKER_KEY"
  sudo -n chmod a+r "$DOCKER_KEY"
fi

actual_fingerprint=$(gpg --show-keys --with-colons "$DOCKER_KEY" 2>/dev/null |
  grep '^fpr:' |
  head -n 1 |
  cut -d: -f10)
if [ "$actual_fingerprint" != "$DOCKER_KEY_FINGERPRINT" ]; then
  fail "Unexpected Docker signing-key fingerprint: $actual_fingerprint"
fi

SOURCE_TEMP=$(mktemp)
printf '%s\n' \
  'Types: deb' \
  'URIs: https://download.docker.com/linux/ubuntu' \
  "Suites: ${VERSION_CODENAME}" \
  'Components: stable' \
  'Architectures: amd64' \
  "Signed-By: ${DOCKER_KEY}" >"$SOURCE_TEMP"

if [ -f "$DOCKER_SOURCE" ] && ! cmp --silent "$SOURCE_TEMP" "$DOCKER_SOURCE"; then
  fail "$DOCKER_SOURCE exists with different content; review it manually."
fi
sudo -n install -m 0644 "$SOURCE_TEMP" "$DOCKER_SOURCE"

proxy_command apt-get update
proxy_command env DEBIAN_FRONTEND=noninteractive apt-get install --yes \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

PROXY_TEMP=$(mktemp)
printf '%s\n' \
  '# Managed by librarymanagement/scripts/setup-docker-wsl.sh' \
  '[Service]' \
  "Environment=\"HTTP_PROXY=${DOCKER_PROXY_URL}\"" \
  "Environment=\"HTTPS_PROXY=${DOCKER_PROXY_URL}\"" \
  'Environment="NO_PROXY=localhost,127.0.0.1,::1"' >"$PROXY_TEMP"

if [ -f "$DOCKER_PROXY_DROP_IN" ] && ! cmp --silent "$PROXY_TEMP" "$DOCKER_PROXY_DROP_IN"; then
  fail "$DOCKER_PROXY_DROP_IN exists with different content; review it manually."
fi
sudo -n install -m 0755 -d /etc/systemd/system/docker.service.d
sudo -n install -m 0644 "$PROXY_TEMP" "$DOCKER_PROXY_DROP_IN"

login_user=$(id -un)
sudo -n usermod -aG docker "$login_user"
sudo -n systemctl daemon-reload
sudo -n systemctl enable --now containerd.service docker.service
sudo -n systemctl restart docker.service

attempt=0
while ! sudo -n docker info >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    sudo -n systemctl --no-pager --full status docker.service || true
    fail 'Docker Engine did not become ready within 30 seconds.'
  fi
  sleep 1
done

printf '%s\n' 'Docker service status:'
sudo -n systemctl --no-pager --full status docker.service | sed -n '1,12p'
printf '%s\n' 'Docker versions:'
sudo -n docker version
sudo -n docker compose version

# Repository rules require querying actual containers before any container run.
sudo -n docker ps
sudo -n docker run --rm hello-world

printf '%s\n' \
  'WSL Docker Engine is ready.' \
  "User $login_user was added to the docker group." \
  'Open a new WSL shell before running Docker without sudo.'
