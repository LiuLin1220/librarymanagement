'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { loadConfig } = require('../../server/config/env')

test('environment configuration applies bounded numeric defaults', () => {
  const config = loadConfig({
    DB_USER: 'library_app',
    DB_NAME: 'librarymanagement'
  })

  assert.equal(config.port, 3001)
  assert.equal(config.corsOrigin, 'http://localhost:8080')
  assert.equal(config.staticDirectory, null)
  assert.deepEqual(config.database, {
    host: '127.0.0.1',
    port: 3306,
    user: 'library_app',
    password: '',
    database: 'librarymanagement',
    connectionLimit: 10
  })
})

test('database password can be loaded from a container secret file', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'library-secret-'))
  const secretFile = path.join(directory, 'db_password')
  fs.writeFileSync(secretFile, 'container-secret\n')
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))

  const config = loadConfig({
    DB_USER: 'library_app',
    DB_NAME: 'librarymanagement',
    DB_PASSWORD_FILE: secretFile,
    STATIC_DIRECTORY: '/app/dist'
  })

  assert.equal(config.database.password, 'container-secret')
  assert.equal(config.staticDirectory, '/app/dist')
})

test('direct and file-backed database passwords are mutually exclusive', () => {
  assert.throws(
    () =>
      loadConfig({
        DB_USER: 'library_app',
        DB_NAME: 'librarymanagement',
        DB_PASSWORD: 'direct-secret',
        DB_PASSWORD_FILE: '/run/secrets/db_app_password'
      }),
    /cannot both be set/
  )
})

test('environment configuration fails early for missing or invalid values', () => {
  assert.throws(
    () => loadConfig({ DB_NAME: 'librarymanagement' }),
    /DB_USER/
  )
  assert.throws(
    () =>
      loadConfig({
        DB_USER: 'library_app',
        DB_NAME: 'librarymanagement',
        PORT: '70000'
      }),
    /PORT/
  )
})
