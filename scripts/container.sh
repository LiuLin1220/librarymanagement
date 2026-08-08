#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="$PROJECT_ROOT/.env.docker"
ENV_TEMPLATE="$PROJECT_ROOT/.env.docker.example"
LEGACY_SECRET_DIRECTORY="$PROJECT_ROOT/.docker-secrets"
SECRET_DIRECTORY=''
APP_SECRET_FILE=''
ROOT_SECRET_FILE=''
ACTION=${1:-up}
WAIT_TIMEOUT_SECONDS=${WAIT_TIMEOUT_SECONDS:-180}
WSL_PROXY_URL=${WSL_PROXY_URL:-http://127.0.0.1:12334}

compose() {
  docker compose --env-file "$ENV_FILE" "$@"
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr '/+' '_-' | tr -d '=\n'
  else
    dd if=/dev/urandom bs=32 count=1 2>/dev/null |
      od -An -tx1 |
      tr -d ' \n'
  fi
}

initialize_deployment_files() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    printf '%s\n' 'Created .env.docker from the tracked template.'
  fi

  resolve_secret_directory
  persist_wsl_secret_directory
  mkdir -p "$SECRET_DIRECTORY"
  chmod 700 "$SECRET_DIRECTORY"
  migrate_legacy_wsl_secrets
  for secret_file in "$APP_SECRET_FILE" "$ROOT_SECRET_FILE"; do
    if [ ! -f "$secret_file" ]; then
      random_secret >"$secret_file"
      chmod 600 "$secret_file"
    fi
  done
}

assert_deployment_files() {
  if [ ! -f "$ENV_FILE" ]; then
    printf 'Deployment file is missing: %s. Run the prepare or up action first.\n' "$ENV_FILE" >&2
    exit 1
  fi
  resolve_secret_directory
  for required_file in "$APP_SECRET_FILE" "$ROOT_SECRET_FILE"; do
    if [ ! -f "$required_file" ]; then
      printf 'Deployment file is missing: %s. Run the prepare or up action first.\n' "$required_file" >&2
      exit 1
    fi
  done
}

deployment_value() {
  name=$1
  default_value=$2
  value=$(sed -n "s/^[[:space:]]*$name[[:space:]]*=[[:space:]]*//p" "$ENV_FILE" |
    tail -n 1 |
    tr -d '\r' |
    sed "s/^[\"']//; s/[\"']$//")
  if [ -n "$value" ]; then
    printf '%s' "$value"
  else
    printf '%s' "$default_value"
  fi
}

is_wsl() {
  grep -qi microsoft /proc/sys/kernel/osrelease 2>/dev/null
}

resolve_secret_directory() {
  configured_directory=${DOCKER_SECRET_DIRECTORY:-}
  if [ -z "$configured_directory" ]; then
    configured_directory=$(deployment_value DOCKER_SECRET_DIRECTORY '')
  fi

  if is_wsl; then
    case "$configured_directory" in
      ''|.docker-secrets|./.docker-secrets)
        configured_directory="${XDG_STATE_HOME:-$HOME/.local/state}/librarymanagement/secrets"
        ;;
    esac
  elif [ -z "$configured_directory" ]; then
    configured_directory=$LEGACY_SECRET_DIRECTORY
  fi

  case "$configured_directory" in
    /*) SECRET_DIRECTORY=$configured_directory ;;
    *) SECRET_DIRECTORY="$PROJECT_ROOT/$configured_directory" ;;
  esac
  if is_wsl; then
    case "$SECRET_DIRECTORY" in
      /mnt/*)
        printf '%s\n' 'WSL secrets must be stored in the Linux filesystem, not below /mnt.' >&2
        exit 1
        ;;
    esac
  fi

  APP_SECRET_FILE="$SECRET_DIRECTORY/db_app_password"
  ROOT_SECRET_FILE="$SECRET_DIRECTORY/db_root_password"
  DOCKER_SECRET_DIRECTORY=$SECRET_DIRECTORY
  export DOCKER_SECRET_DIRECTORY
}

persist_wsl_secret_directory() {
  if ! is_wsl; then
    return
  fi
  configured_directory=$(deployment_value DOCKER_SECRET_DIRECTORY '')
  if [ "$configured_directory" = "$SECRET_DIRECTORY" ]; then
    return
  fi
  case "$configured_directory" in
    ''|.docker-secrets|./.docker-secrets)
      printf '\nDOCKER_SECRET_DIRECTORY=%s\n' "$SECRET_DIRECTORY" >>"$ENV_FILE"
      printf 'Configured WSL secrets in %s.\n' "$SECRET_DIRECTORY"
      ;;
    *)
      printf 'Configured secret directory does not match the resolved path: %s\n' "$configured_directory" >&2
      exit 1
      ;;
  esac
}

migrate_legacy_wsl_secrets() {
  if ! is_wsl || [ "$SECRET_DIRECTORY" = "$LEGACY_SECRET_DIRECTORY" ]; then
    return
  fi
  copied_legacy_secret=false
  for secret_name in db_app_password db_root_password; do
    legacy_file="$LEGACY_SECRET_DIRECTORY/$secret_name"
    destination_file="$SECRET_DIRECTORY/$secret_name"
    if [ ! -f "$legacy_file" ]; then
      continue
    fi
    if [ -f "$destination_file" ]; then
      if ! cmp --silent "$legacy_file" "$destination_file"; then
        printf 'Legacy and WSL-native secrets differ for %s; review them manually.\n' "$secret_name" >&2
        exit 1
      fi
    else
      cp "$legacy_file" "$destination_file"
      copied_legacy_secret=true
    fi
    chmod 600 "$destination_file"
  done
  if [ "$copied_legacy_secret" = true ]; then
    printf '%s\n' 'Copied legacy secrets into the WSL Linux filesystem; originals were retained for explicit cleanup.'
  fi
}

probe_url() {
  host_address=$(deployment_value APP_HOST 127.0.0.1)
  app_port=$(deployment_value APP_PORT 8080)
  case "$app_port" in
    ''|*[!0-9]*)
      printf 'APP_PORT is not valid: %s\n' "$app_port" >&2
      exit 1
      ;;
  esac
  case "$host_address" in
    0.0.0.0) host_address=127.0.0.1 ;;
    ::) host_address='[::1]' ;;
  esac
  printf 'http://%s:%s' "$host_address" "$app_port"
}

verify_deployment() {
  base_url=$(probe_url)
  health=$(curl --fail --silent --show-error "$base_url/health/ready")
  case "$health" in
    *'"status":"ready"'*) ;;
    *)
      printf 'Application readiness check failed: %s\n' "$health" >&2
      exit 1
      ;;
  esac

  curl --fail --silent --show-error --output /dev/null "$base_url/"
  books=$(curl --fail --silent --show-error "$base_url/api/get_books")
  case "$books" in
    *'"isbn"'*) ;;
    *)
      printf '%s\n' 'Seeded book API returned no recognizable records.' >&2
      exit 1
      ;;
  esac
  printf 'Deployment verified: %s\n' "$base_url"
}

backup_current_image() {
  app_image=$(deployment_value APP_IMAGE librarymanagement-app:local)
  rollback_image=$(deployment_value ROLLBACK_IMAGE librarymanagement-app:rollback)
  running_image=$(compose images --quiet app 2>/dev/null | tail -n 1 || true)
  if [ -z "$running_image" ] && docker image inspect "$app_image" >/dev/null 2>&1; then
    running_image=$app_image
  fi
  if [ -n "$running_image" ]; then
    docker image tag "$running_image" "$rollback_image"
    printf 'Retained previous application image as %s.\n' "$rollback_image"
  fi
}

configure_wsl_build_proxy() {
  if ! is_wsl; then
    return
  fi
  if [ -n "${BUILD_HTTP_PROXY:-}" ]; then
    return
  fi
  if ! curl --proxy "$WSL_PROXY_URL" --fail --silent --show-error \
    --output /dev/null --connect-timeout 5 --max-time 15 \
    https://download.docker.com/linux/ubuntu/; then
    printf 'WSL proxy is unavailable: %s\n' "$WSL_PROXY_URL" >&2
    exit 1
  fi

  BUILD_NETWORK=host
  BUILD_HTTP_PROXY=$WSL_PROXY_URL
  BUILD_HTTPS_PROXY=$WSL_PROXY_URL
  BUILD_NO_PROXY='localhost,127.0.0.1,::1'
  export BUILD_NETWORK BUILD_HTTP_PROXY BUILD_HTTPS_PROXY BUILD_NO_PROXY
  printf 'Using WSL build proxy: %s (host network for build steps).\n' "$WSL_PROXY_URL"
}

cd "$PROJECT_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' 'Docker CLI was not found. Install or start Docker first.' >&2
  exit 1
fi
if ! docker version --format '{{.Server.Version}}' >/dev/null 2>&1; then
  printf '%s\n' 'Docker is installed, but its engine is not reachable.' >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' 'Docker Compose v2 is required.' >&2
  exit 1
fi
case "$ACTION" in
  prepare|up) initialize_deployment_files ;;
  down|status|logs|verify|rollback) assert_deployment_files ;;
  *)
    printf 'Unknown action: %s\n' "$ACTION" >&2
    printf '%s\n' 'Allowed actions: prepare, up, down, status, logs, verify, rollback' >&2
    exit 1
    ;;
esac

case "$WAIT_TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    printf 'WAIT_TIMEOUT_SECONDS is not valid: %s\n' "$WAIT_TIMEOUT_SECONDS" >&2
    exit 1
    ;;
esac
if [ "$WAIT_TIMEOUT_SECONDS" -lt 30 ] || [ "$WAIT_TIMEOUT_SECONDS" -gt 900 ]; then
  printf '%s\n' 'WAIT_TIMEOUT_SECONDS must be between 30 and 900.' >&2
  exit 1
fi

case "$ACTION" in
  up|verify|rollback)
    if ! command -v curl >/dev/null 2>&1; then
      printf '%s\n' 'curl is required for deployment verification.' >&2
      exit 1
    fi
    ;;
esac

if [ "$ACTION" = 'up' ]; then
  configure_wsl_build_proxy
fi

compose config --quiet

case "$ACTION" in
  prepare)
    printf '%s\n' 'Deployment files are ready and the Compose configuration is valid. No image was built and no container was started.'
    ;;
  up)
    backup_current_image
    if ! compose up --detach --build --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS"; then
      compose ps || true
      compose logs --tail 120 || true
      printf '%s\n' 'Deployment failed. If a previous image was retained, run the rollback action.' >&2
      exit 1
    fi
    verify_deployment
    compose ps
    compose images
    ;;
  down)
    compose down --remove-orphans
    printf '%s\n' 'Containers stopped. The database volume and local secrets were preserved.'
    ;;
  status)
    compose ps
    compose images
    ;;
  logs)
    compose logs --tail 200 --follow
    ;;
  verify)
    verify_deployment
    compose ps
    ;;
  rollback)
    app_image=$(deployment_value APP_IMAGE librarymanagement-app:local)
    rollback_image=$(deployment_value ROLLBACK_IMAGE librarymanagement-app:rollback)
    if ! docker image inspect "$rollback_image" >/dev/null 2>&1; then
      printf 'Rollback image does not exist: %s\n' "$rollback_image" >&2
      exit 1
    fi
    docker image tag "$rollback_image" "$app_image"
    compose up --detach --no-build --no-deps --force-recreate \
      --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS" app
    verify_deployment
    ;;
esac
