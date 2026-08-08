'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')
const { loadConfig } = require('../../server/config/env')

test('environment configuration applies bounded numeric defaults', () => {
  const config = loadConfig({
    DB_USER: 'library_app',
    DB_NAME: 'librarymanagement'
  })

  assert.equal(config.port, 3001)
  assert.equal(config.corsOrigin, 'http://localhost:8080')
  assert.deepEqual(config.database, {
    host: '127.0.0.1',
    port: 3306,
    user: 'library_app',
    password: '',
    database: 'librarymanagement',
    connectionLimit: 10
  })
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
