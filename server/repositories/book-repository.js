'use strict'

const SQL = Object.freeze({
  addBook:
    'INSERT INTO bookbaseinfo (isbn, title, author, publisher, price) VALUES (?, ?, ?, ?, ?)',
  updateBook:
    'UPDATE bookbaseinfo SET Title = ?, Author = ?, Publisher = ?, Price = ? WHERE ISBN = ?',
  listBooks: 'SELECT * FROM 图书基本信息',
  deleteBook: 'DELETE FROM bookbaseinfo WHERE ISBN = ?',
  listInventory: 'SELECT * FROM 图书数量',
  addPurchase:
    'INSERT INTO buyinfo (ISBN, BuyQuantity, BuyAmount, BuyDate) VALUES (?, ?, ?, ?)',
  addSale:
    'INSERT INTO saleinfo (ISBN, SaleQuantity, SaleAmount, SaleDate) VALUES (?, ?, ?, ?)',
  listSales: 'SELECT * FROM 图书销售',
  listMonthlySales: 'CALL get_book_sale_month(?)'
})

function mapBook(row) {
  return {
    isbn: row.书号,
    title: row.书名,
    author: row.作者,
    publisher: row.出版社,
    price: row['价格（元）']
  }
}

function mapInventory(row) {
  return {
    isbn: row.书号,
    title: row.书名,
    author: row.作者,
    num: row.数量
  }
}

function mapSale(row) {
  return {
    title: row.书名,
    author: row.作者,
    SaleQuantity: row.销售数量,
    SaleAmount: row.销售金额,
    SaleDate: row.销售日期
  }
}

function mapMonthlySale(row) {
  return {
    title: row.书名,
    author: row.作者,
    totalSaleQuantity: row.总销售数量,
    totalSaleAmount: row.总销售金额
  }
}

function createBookRepository(database) {
  if (!database || typeof database.execute !== 'function') {
    throw new TypeError('A database with an execute method is required')
  }

  return Object.freeze({
    async addBook(book) {
      const [result] = await database.execute(SQL.addBook, [
        book.isbn,
        book.title,
        book.author,
        book.publisher,
        book.price
      ])
      return result.affectedRows
    },

    async updateBook(book) {
      const [result] = await database.execute(SQL.updateBook, [
        book.title,
        book.author,
        book.publisher,
        book.price,
        book.isbn
      ])
      return result.affectedRows
    },

    async listBooks() {
      const [rows] = await database.execute(SQL.listBooks)
      return rows.map(mapBook)
    },

    async deleteBook(isbn) {
      const [result] = await database.execute(SQL.deleteBook, [isbn])
      return result.affectedRows
    },

    async listInventory() {
      const [rows] = await database.execute(SQL.listInventory)
      return rows.map(mapInventory)
    },

    async addPurchase(purchase) {
      const [result] = await database.execute(SQL.addPurchase, [
        purchase.isbn,
        purchase.quantity,
        purchase.amount,
        purchase.date
      ])
      return result.affectedRows
    },

    async addSale(sale) {
      const [result] = await database.execute(SQL.addSale, [
        sale.isbn,
        sale.quantity,
        sale.amount,
        sale.date
      ])
      return result.affectedRows
    },

    async listSales() {
      const [rows] = await database.execute(SQL.listSales)
      return rows.map(mapSale)
    },

    async listMonthlySales(yearMonth) {
      const [resultSets] = await database.execute(SQL.listMonthlySales, [yearMonth])
      const rows = Array.isArray(resultSets[0]) ? resultSets[0] : []
      return rows.map(mapMonthlySale)
    }
  })
}

module.exports = {
  createBookRepository
}
