'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')
const { createBookRepository } = require('../../server/repositories/book-repository')

test('book repository maps database view columns to the API contract', async () => {
  const calls = []
  const database = {
    async execute(sql, parameters) {
      calls.push({ sql, parameters })
      return [
        [
          {
            书号: 1001,
            书名: '深入理解计算机系统',
            作者: 'Randal E. Bryant',
            出版社: '机械工业出版社',
            '价格（元）': 713
          }
        ]
      ]
    }
  }
  const repository = createBookRepository(database)

  const books = await repository.listBooks()

  assert.deepEqual(books, [
    {
      isbn: 1001,
      title: '深入理解计算机系统',
      author: 'Randal E. Bryant',
      publisher: '机械工业出版社',
      price: 713
    }
  ])
  assert.match(calls[0].sql, /图书基本信息/)
})

test('book repository keeps sale parameter order explicit', async () => {
  let call
  const database = {
    async execute(sql, parameters) {
      call = { sql, parameters }
      return [{ affectedRows: 1 }]
    }
  }
  const repository = createBookRepository(database)

  const affectedRows = await repository.addSale({
    isbn: 1001,
    quantity: 2,
    amount: 198,
    date: '2026-08-08'
  })

  assert.equal(affectedRows, 1)
  assert.match(call.sql, /INSERT INTO saleinfo/)
  assert.deepEqual(call.parameters, [1001, 2, 198, '2026-08-08'])
})

test('monthly stored-procedure results ignore metadata result sets', async () => {
  const database = {
    async execute() {
      return [
        [
          [
            {
              书名: '重构',
              作者: 'Martin Fowler',
              总销售数量: 3,
              总销售金额: 297
            }
          ],
          { affectedRows: 0 }
        ]
      ]
    }
  }
  const repository = createBookRepository(database)

  const result = await repository.listMonthlySales('2026-08')

  assert.deepEqual(result, [
    {
      title: '重构',
      author: 'Martin Fowler',
      totalSaleQuantity: 3,
      totalSaleAmount: 297
    }
  ])
})
