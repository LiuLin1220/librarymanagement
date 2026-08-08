'use strict'

const mysql = require('mysql2/promise')

function createDatabasePool(config) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true,
    enableKeepAlive: true
  })
}

module.exports = {
  createDatabasePool
}
