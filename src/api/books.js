import http from './http'

function responseData(request) {
  return request.then(response => response.data)
}

export function addBook(book) {
  return responseData(http.post('/add_books', book))
}

export function updateBook(book) {
  return responseData(http.post('/update_book_baseinfo', book))
}

export function listBooks() {
  return responseData(http.get('/get_books'))
}

export function deleteBook(isbn) {
  return responseData(http.delete(`/dele_book/${isbn}`))
}

export function listInventory() {
  return responseData(http.get('/get_books_num'))
}

export function addPurchase(purchase) {
  return responseData(
    http.post('/buy_books', {
      isbn: purchase.isbn,
      BuyQuantity: purchase.quantity,
      BuyAmount: purchase.amount,
      BuyDate: purchase.date
    })
  )
}

export function addSale(sale) {
  return responseData(
    http.post('/sale_books', {
      isbn: sale.isbn,
      SaleQuantity: sale.quantity,
      SaleAmount: sale.amount,
      SaleDate: sale.date
    })
  )
}

export function listSales() {
  return responseData(http.get('/get_books_sale'))
}

export function listMonthlySales(yearMonth) {
  return responseData(http.post('/get_books_sale_month', { yearMonth }))
}
