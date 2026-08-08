'use strict'

const path = require('node:path')
const dotenv = require('dotenv')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

function loadEnvironmentFiles(rootDirectory = PROJECT_ROOT) {
  dotenv.config({ path: path.join(rootDirectory, '.env'), quiet: true })
  dotenv.config({
    path: path.join(rootDirectory, '.env.local'),
    override: true,
    quiet: true
  })
}

function requireText(environment, name) {
  const value = environment[name]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

function readInteger(environment, name, defaultValue, minimum, maximum) {
  const rawValue = environment[name]
  if (rawValue === undefined || rawValue === '') {
    return defaultValue
  }

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}`
    )
  }
  return value
}

function loadConfig(environment = process.env) {
  return Object.freeze({
    port: readInteger(environment, 'PORT', 3001, 1, 65535),
    corsOrigin: environment.CORS_ORIGIN || 'http://localhost:8080',
    database: Object.freeze({
      host: environment.DB_HOST || '127.0.0.1',
      port: readInteger(environment, 'DB_PORT', 3306, 1, 65535),
      user: requireText(environment, 'DB_USER'),
      password: environment.DB_PASSWORD || '',
      database: requireText(environment, 'DB_NAME'),
      connectionLimit: readInteger(
        environment,
        'DB_CONNECTION_LIMIT',
        10,
        1,
        100
      )
    })
  })
}

module.exports = {
  loadConfig,
  loadEnvironmentFiles
}
