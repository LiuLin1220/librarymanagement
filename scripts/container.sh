#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="$PROJECT_ROOT/.env.docker"
ENV_TEMPLATE="$PROJECT_ROOT/.env.docker.example"
SECRET_DIRECTORY="$PROJECT_ROOT/.docker-secrets"
APP_SECRET_FILE="$SECRET_DIRECTORY/db_app_password"
ROOT_SECRET_FILE="$SECRET_DIRECTORY/db_root_password"
ACTION=${1:-up}
WAIT_TIMEOUT_SECONDS=${WAIT_TIMEOUT_SECONDS:-180}

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

  mkdir -p "$SECRET_DIRECTORY"
  chmod 700 "$SECRET_DIRECTORY"
  for secret_file in "$APP_SECRET_FILE" "$ROOT_SECRET_FILE"; do
    if [ ! -f "$secret_file" ]; then
      random_secret >"$secret_file"
      chmod 600 "$secret_file"
    fi
  done
}

assert_deployment_files() {
  for required_file in "$ENV_FILE" "$APP_SECRET_FILE" "$ROOT_SECRET_FILE"; do
    if [ ! -f "$required_file" ]; then
      printf 'Deployment file is missing: %s. Run the up action first.\n' "$required_file" >&2
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
  up) initialize_deployment_files ;;
  down|status|logs|verify|rollback) assert_deployment_files ;;
  *)
    printf 'Unknown action: %s\n' "$ACTION" >&2
    printf '%s\n' 'Allowed actions: up, down, status, logs, verify, rollback' >&2
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

compose config --quiet

case "$ACTION" in
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
