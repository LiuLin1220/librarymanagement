'use strict'

const express = require('express')
const { HttpError } = require('../lib/http-error')
const {
  parseBook,
  parseIsbn,
  parseTransaction,
  parseYearMonth
} = require('../validation/book-input')

function notFound(message) {
  return new HttpError(404, 'NOT_FOUND', message)
}

function createBookRouter(bookRepository) {
  if (!bookRepository) {
    throw new TypeError('A book repository is required')
  }

  const router = express.Router()

  router.post('/add_books', async (request, response) => {
    const book = parseBook(request.body)
    const affectedRows = await bookRepository.addBook(book)
    if (affectedRows !== 1) {
      throw new Error('Book insert did not affect exactly one row')
    }
    response.status(201).json({ data: { isbn: book.isbn } })
  })

  router.post('/update_book_baseinfo', async (request, response) => {
    const book = parseBook(request.body)
    const affectedRows = await bookRepository.updateBook(book)
    if (affectedRows === 0) {
      throw notFound('未找到要修改的图书')
    }
    response.json({ data: { isbn: book.isbn } })
  })

  router.get('/get_books', async (request, response) => {
    response.json(await bookRepository.listBooks())
  })

  router.delete('/dele_book/:id', async (request, response) => {
    const isbn = parseIsbn(request.params.id)
    const affectedRows = await bookRepository.deleteBook(isbn)
    if (affectedRows === 0) {
      throw notFound('未找到要删除的图书')
    }
    response.json({ data: { isbn } })
  })

  router.get('/get_books_num', async (request, response) => {
    response.json(await bookRepository.listInventory())
  })

  router.post('/buy_books', async (request, response) => {
    const purchase = parseTransaction(request.body, 'purchase')
    const affectedRows = await bookRepository.addPurchase(purchase)
    if (affectedRows !== 1) {
      throw new Error('Purchase insert did not affect exactly one row')
    }
    response.status(201).json({ data: { isbn: purchase.isbn } })
  })

  router.post('/sale_books', async (request, response) => {
    const sale = parseTransaction(request.body, 'sale')
    const affectedRows = await bookRepository.addSale(sale)
    if (affectedRows !== 1) {
      throw new Error('Sale insert did not affect exactly one row')
    }
    response.status(201).json({ data: { isbn: sale.isbn } })
  })

  router.get('/get_books_sale', async (request, response) => {
    response.json(await bookRepository.listSales())
  })

  router.post('/get_books_sale_month', async (request, response) => {
    const yearMonth = parseYearMonth(request.body)
    response.json(await bookRepository.listMonthlySales(yearMonth))
  })

  return router
}

module.exports = {
  createBookRouter
}
