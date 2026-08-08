'use strict'

const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
const cors = require('cors')
const { createBookRouter } = require('./routes/books')
const { createErrorHandler } = require('./middleware/error-handler')
const { HttpError } = require('./lib/http-error')

function parseOrigins(value) {
  if (value === '*') {
    return '*'
  }
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

function isBackendPath(requestPath) {
  return (
    requestPath === '/api' ||
    requestPath.startsWith('/api/') ||
    requestPath === '/health' ||
    requestPath.startsWith('/health/')
  )
}

function mountStaticFrontend(app, staticDirectory) {
  if (!staticDirectory) {
    return
  }

  const resolvedDirectory = path.resolve(staticDirectory)
  const indexFile = path.join(resolvedDirectory, 'index.html')
  if (!fs.existsSync(indexFile)) {
    throw new Error(`Static frontend index not found: ${indexFile}`)
  }

  app.use(express.static(resolvedDirectory, { index: false }))
  app.use((request, response, next) => {
    const canServeFrontend =
      (request.method === 'GET' || request.method === 'HEAD') &&
      !isBackendPath(request.path) &&
      request.accepts('html')

    if (!canServeFrontend) {
      next()
      return
    }

    response.set('Cache-Control', 'no-cache')
    response.sendFile(indexFile, error => {
      if (error) {
        next(error)
      }
    })
  })
}

function createApp({
  bookRepository,
  corsOrigin = 'http://localhost:8080',
  logger = console,
  readinessCheck = async () => {},
  staticDirectory = null
}) {
  const app = express()
  app.disable('x-powered-by')

  app.use(cors({ origin: parseOrigins(corsOrigin) }))
  app.use(express.json({ limit: '32kb' }))
  app.use(express.urlencoded({ extended: false, limit: '32kb' }))

  app.get('/health', (request, response) => {
    response.json({ status: 'ok' })
  })
  app.get('/health/ready', async (request, response) => {
    try {
      await readinessCheck()
      response.json({ status: 'ready' })
    } catch {
      response.status(503).json({ status: 'not_ready' })
    }
  })
  app.use('/api', createBookRouter(bookRepository))
  mountStaticFrontend(app, staticDirectory)

  app.use((request, response, next) => {
    next(new HttpError(404, 'ROUTE_NOT_FOUND', '接口不存在'))
  })
  app.use(createErrorHandler(logger))

  return app
}

module.exports = {
  createApp
}
