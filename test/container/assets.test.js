'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8')
}

test('runtime image is multi-stage, production-only and non-root', () => {
  const dockerfile = read('Dockerfile')

  assert.match(dockerfile, /AS frontend-build/)
  assert.match(dockerfile, /npm ci --omit=dev/)
  assert.match(dockerfile, /COPY --chown=node:node --from=frontend-build/)
  assert.match(dockerfile, /USER node/)
  assert.match(dockerfile, /CMD \["node", "server\/index\.js"\]/)
})

test('compose waits for initialized MySQL and keeps secrets out of environment values', () => {
  const compose = read('compose.yaml')
  const databaseBlock = compose.match(/\n {2}db:\n[\s\S]*?(?=\nvolumes:)/)

  assert.ok(databaseBlock, 'database service must exist')
  assert.doesNotMatch(databaseBlock[0], /^ {4}ports:/m)
  assert.match(compose, /condition: service_healthy/)
  assert.match(compose, /network: \$\{BUILD_NETWORK:-default\}/)
  assert.match(compose, /HTTP_PROXY: \$\{BUILD_HTTP_PROXY:-\}/)
  assert.match(compose, /file: \$\{DOCKER_SECRET_DIRECTORY:-\.docker-secrets\}\/db_app_password/)
  assert.match(compose, /DB_PASSWORD_FILE: \/run\/secrets\/db_app_password/)
  assert.match(compose, /MYSQL_ROOT_PASSWORD_FILE: \/run\/secrets\/db_root_password/)
  assert.match(compose, /db-data:\/var\/lib\/mysql/)
  assert.match(compose, /librarymanagement\.sql:\/docker-entrypoint-initdb\.d/)
  assert.match(compose, /127\.0\.0\.1.*8080.*3001/)
})

test('one-click scripts validate Compose, wait for health and retain rollback paths', () => {
  for (const script of ['scripts/container.ps1', 'scripts/container.sh']) {
    const source = read(script)

    assert.match(source, /prepare/)
    assert.match(source, /config.*--quiet/s)
    assert.match(source, /--wait/)
    assert.match(source, /health\/ready/)
    assert.match(source, /api\/get_books/)
    assert.match(source, /rollback/i)
  }
})

test('prepare validates deployment inputs without building or starting containers', () => {
  const posix = read('scripts/container.sh')
  const powershell = read('scripts/container.ps1')

  assert.match(posix, /prepare\|up\) initialize_deployment_files/)
  assert.match(posix, /prepare\)[\s\S]*No image was built and no container was started/)
  assert.match(powershell, /'prepare', 'up'/)
  assert.match(powershell, /'prepare' \{[\s\S]*No image was built and no container was started/)
  assert.match(posix, /XDG_STATE_HOME.*\.local\/state.*librarymanagement\/secrets/)
  assert.match(posix, /WSL secrets must be stored in the Linux filesystem/)
})

test('WSL setup uses the official repository, verifies its key and checks containers first', () => {
  const source = read('scripts/setup-docker-wsl.sh')
  const psPosition = source.indexOf('docker ps')
  const runPosition = source.indexOf('docker run --rm hello-world')

  assert.match(source, /download\.docker\.com\/linux\/ubuntu/)
  assert.match(source, /9DC858229FC7DD38854AE2D88D81803C0EBFCD88/)
  assert.match(source, /docker-compose-plugin/)
  assert.match(source, /systemctl enable --now containerd\.service docker\.service/)
  assert.ok(psPosition > 0 && psPosition < runPosition)
})
