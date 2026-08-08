'use strict'

const { createApp } = require('./app')
const { createDatabasePool } = require('./config/database')
const { loadConfig, loadEnvironmentFiles } = require('./config/env')
const { createBookRepository } = require('./repositories/book-repository')

async function startServer() {
  loadEnvironmentFiles()
  const config = loadConfig()
  const database = createDatabasePool(config.database)
  const bookRepository = createBookRepository(database)
  const app = createApp({
    bookRepository,
    corsOrigin: config.corsOrigin
  })

  const server = app.listen(config.port, () => {
    console.info(`API listening on http://localhost:${config.port}`)
  })

  let shuttingDown = false
  async function shutdown(signal) {
    if (shuttingDown) {
      return
    }
    shuttingDown = true
    console.info(`Received ${signal}; shutting down`)

    server.close(async error => {
      try {
        await database.end()
      } catch (databaseError) {
        console.error('Failed to close database pool', databaseError)
        process.exitCode = 1
      }

      if (error) {
        console.error('Failed to close HTTP server', error)
        process.exitCode = 1
      }
    })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  return { app, database, server }
}

if (require.main === module) {
  startServer().catch(error => {
    console.error('API failed to start', error.message)
    process.exitCode = 1
  })
}

module.exports = {
  startServer
}
