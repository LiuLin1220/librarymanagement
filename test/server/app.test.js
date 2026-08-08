'use strict'

const assert = require('node:assert/strict')
const http = require('node:http')
const test = require('node:test')
const { createApp } = require('../../server/app')

function createRepository(overrides = {}) {
  return {
    addBook: async () => 1,
    updateBook: async () => 1,
    listBooks: async () => [],
    deleteBook: async () => 1,
    listInventory: async () => [],
    addPurchase: async () => 1,
    addSale: async () => 1,
    listSales: async () => [],
    listMonthlySales: async () => [],
    ...overrides
  }
}

async function request(app, options = {}) {
  const server = http.createServer(app)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  try {
    const address = server.address()
    const rawBody =
      options.rawBody !== undefined
        ? options.rawBody
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body)

    const response = await new Promise((resolve, reject) => {
      const clientRequest = http.request(
        {
          host: '127.0.0.1',
          port: address.port,
          method: options.method || 'GET',
          path: options.path || '/',
          headers: rawBody
            ? {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(rawBody)
              }
            : undefined
        },
        incoming => {
          const chunks = []
          incoming.on('data', chunk => chunks.push(chunk))
          incoming.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve({
              status: incoming.statusCode,
              headers: incoming.headers,
              body: text ? JSON.parse(text) : undefined
            })
          })
        }
      )
      clientRequest.once('error', reject)
      if (rawBody) {
        clientRequest.write(rawBody)
      }
      clientRequest.end()
    })

    return response
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()))
    })
  }
}

const silentLogger = {
  error() {}
}

test('health endpoint is independent from the database', async () => {
  const app = createApp({
    bookRepository: createRepository(),
    logger: silentLogger
  })

  const response = await request(app, { path: '/health' })

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok' })
  assert.equal(response.headers['x-powered-by'], undefined)
})

test('collection endpoints keep an empty collection as an array', async () => {
  const app = createApp({
    bookRepository: createRepository({ listBooks: async () => [] }),
    logger: silentLogger
  })

  const response = await request(app, { path: '/api/get_books' })

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, [])
})

test('book creation normalizes form strings before calling the repository', async () => {
  let receivedBook
  const app = createApp({
    bookRepository: createRepository({
      addBook: async book => {
        receivedBook = book
        return 1
      }
    }),
    logger: silentLogger
  })

  const response = await request(app, {
    method: 'POST',
    path: '/api/add_books',
    body: {
      isbn: '1001',
      title: '  重构  ',
      author: 'Martin Fowler',
      publisher: '人民邮电出版社',
      price: '99.50'
    }
  })

  assert.equal(response.status, 201)
  assert.deepEqual(receivedBook, {
    isbn: 1001,
    title: '重构',
    author: 'Martin Fowler',
    publisher: '人民邮电出版社',
    price: 99.5
  })
  assert.deepEqual(response.body, { data: { isbn: 1001 } })
})

test('invalid input returns 400 without calling the repository', async () => {
  let called = false
  const app = createApp({
    bookRepository: createRepository({
      addBook: async () => {
        called = true
        return 1
      }
    }),
    logger: silentLogger
  })

  const response = await request(app, {
    method: 'POST',
    path: '/api/add_books',
    body: { isbn: 0 }
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
  assert.equal(response.body.error.details.field, 'isbn')
  assert.equal(called, false)
})

test('database numeric boundaries are rejected at the API edge', async () => {
  const app = createApp({
    bookRepository: createRepository(),
    logger: silentLogger
  })

  const response = await request(app, {
    method: 'POST',
    path: '/api/add_books',
    body: {
      isbn: 2147483648,
      title: '重构',
      author: 'Martin Fowler',
      publisher: '人民邮电出版社',
      price: 100000000
    }
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
  assert.equal(response.body.error.details.field, 'isbn')

  const priceResponse = await request(app, {
    method: 'POST',
    path: '/api/add_books',
    body: {
      isbn: 1001,
      title: '重构',
      author: 'Martin Fowler',
      publisher: '人民邮电出版社',
      price: 100000000
    }
  })
  assert.equal(priceResponse.status, 400)
  assert.equal(priceResponse.body.error.details.field, 'price')
})

test('missing records return a structured 404', async () => {
  const app = createApp({
    bookRepository: createRepository({ updateBook: async () => 0 }),
    logger: silentLogger
  })

  const response = await request(app, {
    method: 'POST',
    path: '/api/update_book_baseinfo',
    body: {
      isbn: 1001,
      title: '重构',
      author: 'Martin Fowler',
      publisher: '人民邮电出版社',
      price: 99
    }
  })

  assert.equal(response.status, 404)
  assert.deepEqual(response.body, {
    error: { code: 'NOT_FOUND', message: '未找到要修改的图书' }
  })
})

test('repository failures terminate with a safe 500 response', async () => {
  const logged = []
  const app = createApp({
    bookRepository: createRepository({
      listBooks: async () => {
        const error = new Error('password=secret; SQL SELECT failed')
        error.code = 'ECONNREFUSED'
        throw error
      }
    }),
    logger: { error: (...arguments_) => logged.push(arguments_) }
  })

  const response = await request(app, { path: '/api/get_books' })

  assert.equal(response.status, 500)
  assert.deepEqual(response.body, {
    error: { code: 'INTERNAL_ERROR', message: '服务器处理请求失败' }
  })
  assert.equal(JSON.stringify(response.body).includes('secret'), false)
  assert.equal(logged.length, 1)
})

test('monthly sales reject a non-padded month', async () => {
  const app = createApp({
    bookRepository: createRepository(),
    logger: silentLogger
  })

  const response = await request(app, {
    method: 'POST',
    path: '/api/get_books_sale_month',
    body: { yearMonth: '2026-8' }
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.details.field, 'yearMonth')
})

test('malformed JSON and unknown routes use the shared error contract', async t => {
  const app = createApp({
    bookRepository: createRepository(),
    logger: silentLogger
  })

  await t.test('malformed JSON', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/add_books',
      rawBody: '{'
    })
    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, 'INVALID_JSON')
  })

  await t.test('unknown route', async () => {
    const response = await request(app, { path: '/api/missing' })
    assert.equal(response.status, 404)
    assert.equal(response.body.error.code, 'ROUTE_NOT_FOUND')
  })
})
