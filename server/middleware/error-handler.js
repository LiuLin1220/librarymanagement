'use strict'

const { HttpError } = require('../lib/http-error')

function normalizeError(error) {
  if (error instanceof HttpError) {
    return error
  }

  if (error && error.type === 'entity.parse.failed') {
    return new HttpError(400, 'INVALID_JSON', '请求体不是有效的 JSON')
  }

  if (error && error.code === 'ER_DUP_ENTRY') {
    return new HttpError(409, 'RESOURCE_CONFLICT', '记录已存在')
  }

  if (error && error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new HttpError(400, 'REFERENCE_NOT_FOUND', '关联的图书不存在')
  }

  return new HttpError(500, 'INTERNAL_ERROR', '服务器处理请求失败')
}

function createErrorHandler(logger = console) {
  return function errorHandler(error, request, response, next) {
    if (response.headersSent) {
      next(error)
      return
    }

    const publicError = normalizeError(error)
    if (publicError.status >= 500) {
      logger.error('API request failed', {
        method: request.method,
        path: request.originalUrl,
        code: error && error.code,
        message: error && error.message
      })
    }

    const body = {
      error: {
        code: publicError.code,
        message: publicError.message
      }
    }
    if (publicError.details) {
      body.error.details = publicError.details
    }

    response.status(publicError.status).json(body)
  }
}

module.exports = {
  createErrorHandler
}
