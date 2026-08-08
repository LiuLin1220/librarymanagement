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

test('docker compose up -d is the complete deployment interface', () => {
  const compose = read('compose.yaml')
  const readme = read('README.md')

  assert.match(compose, /^name: librarymanagement/m)
  assert.match(compose, /pull_policy: build/)
  assert.match(compose, /network: \$\{BUILD_NETWORK-host\}/)
  assert.match(compose, /HTTP_PROXY: \$\{BUILD_HTTP_PROXY-http:\/\/127\.0\.0\.1:12334\}/)
  assert.match(readme, /docker compose up -d/)
  assert.doesNotMatch(readme, /scripts\/container/)
})

test('compose generates persistent file-backed database secrets without host preparation', () => {
  const compose = read('compose.yaml')
  const initializerBlock = compose.match(/\n {2}secret-init:\n[\s\S]*?(?=\n {2}db:)/)

  assert.ok(initializerBlock, 'secret initializer service must exist')
  assert.match(initializerBlock[0], /alpine:3\.23\.5/)
  assert.match(initializerBlock[0], /\/dev\/urandom/)
  assert.match(initializerBlock[0], /deployment-secrets:\/run\/generated-secrets/)
  assert.match(compose, /condition: service_completed_successfully/)
  assert.match(compose, /deployment-secrets:\/run\/secrets:ro/)
  assert.match(compose, /DB_PASSWORD_FILE: \/run\/secrets\/db_app_password/)
  assert.match(compose, /MYSQL_ROOT_PASSWORD_FILE: \/run\/secrets\/db_root_password/)
  assert.doesNotMatch(compose, /^secrets:/m)
  assert.doesNotMatch(compose, /\.docker-secrets/)
})

test('database stays internal, waits for initialization and persists in a named volume', () => {
  const compose = read('compose.yaml')
  const databaseBlock = compose.match(/\n {2}db:\n[\s\S]*?(?=\n {2}app:)/)

  assert.ok(databaseBlock, 'database service must exist')
  assert.doesNotMatch(databaseBlock[0], /^ {4}ports:/m)
  assert.match(databaseBlock[0], /condition: service_completed_successfully/)
  assert.match(databaseBlock[0], /db-data:\/var\/lib\/mysql/)
  assert.match(databaseBlock[0], /librarymanagement\.sql:\/docker-entrypoint-initdb\.d/)
  assert.match(compose, /condition: service_healthy/)
  assert.match(compose, /127\.0\.0\.1.*8080.*3001/)
})

test('documentation keeps ordinary stop separate from destructive volume deletion', () => {
  const deploymentGuide = read('docs/container-deployment.md')

  assert.match(deploymentGuide, /docker compose down/)
  assert.match(deploymentGuide, /docker compose down -v/)
  assert.match(deploymentGuide, /不可恢复|不可逆/)
})
