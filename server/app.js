'use strict'

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

function createApp({
  bookRepository,
  corsOrigin = 'http://localhost:8080',
  logger = console
}) {
  const app = express()
  app.disable('x-powered-by')

  app.use(cors({ origin: parseOrigins(corsOrigin) }))
  app.use(express.json({ limit: '32kb' }))
  app.use(express.urlencoded({ extended: false, limit: '32kb' }))

  app.get('/health', (request, response) => {
    response.json({ status: 'ok' })
  })
  app.use('/api', createBookRouter(bookRepository))

  app.use((request, response, next) => {
    next(new HttpError(404, 'ROUTE_NOT_FOUND', '接口不存在'))
  })
  app.use(createErrorHandler(logger))

  return app
}

module.exports = {
  createApp
}
