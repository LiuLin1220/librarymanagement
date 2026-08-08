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
  assert.match(compose, /DB_PASSWORD_FILE: \/run\/secrets\/db_app_password/)
  assert.match(compose, /MYSQL_ROOT_PASSWORD_FILE: \/run\/secrets\/db_root_password/)
  assert.match(compose, /db-data:\/var\/lib\/mysql/)
  assert.match(compose, /librarymanagement\.sql:\/docker-entrypoint-initdb\.d/)
  assert.match(compose, /127\.0\.0\.1.*8080.*3001/)
})

test('one-click scripts validate Compose, wait for health and retain rollback paths', () => {
  for (const script of ['scripts/container.ps1', 'scripts/container.sh']) {
    const source = read(script)

    assert.match(source, /config.*--quiet/s)
    assert.match(source, /--wait/)
    assert.match(source, /health\/ready/)
    assert.match(source, /api\/get_books/)
    assert.match(source, /rollback/i)
  }
})
