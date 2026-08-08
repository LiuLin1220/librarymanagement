'use strict'

const fs = require('node:fs')
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

function readSecret(environment, valueName, fileName) {
  const directValue = environment[valueName]
  const secretFile = environment[fileName]
  const hasDirectValue =
    typeof directValue === 'string' && directValue.trim() !== ''
  const hasSecretFile =
    typeof secretFile === 'string' && secretFile.trim() !== ''

  if (hasDirectValue && hasSecretFile) {
    throw new Error(`${valueName} and ${fileName} cannot both be set`)
  }
  if (!hasSecretFile) {
    return hasDirectValue ? directValue : ''
  }

  let value
  try {
    value = fs.readFileSync(secretFile.trim(), 'utf8').trim()
  } catch (error) {
    throw new Error(`Unable to read ${fileName}: ${error.message}`)
  }
  if (!value) {
    throw new Error(`${fileName} points to an empty secret file`)
  }
  return value
}

function loadConfig(environment = process.env) {
  return Object.freeze({
    port: readInteger(environment, 'PORT', 3001, 1, 65535),
    corsOrigin: environment.CORS_ORIGIN || 'http://localhost:8080',
    staticDirectory: environment.STATIC_DIRECTORY || null,
    database: Object.freeze({
      host: environment.DB_HOST || '127.0.0.1',
      port: readInteger(environment, 'DB_PORT', 3306, 1, 65535),
      user: requireText(environment, 'DB_USER'),
      password: readSecret(environment, 'DB_PASSWORD', 'DB_PASSWORD_FILE'),
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
