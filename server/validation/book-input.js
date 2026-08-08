'use strict'

const { HttpError } = require('../lib/http-error')

function validationError(field, message) {
  throw new HttpError(400, 'VALIDATION_ERROR', message, { field })
}

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    validationError('body', '请求体必须是 JSON 对象')
  }
  return value
}

function positiveInteger(value, field, label, maximum = 2147483647) {
  if (value === '' || value === null || value === undefined) {
    validationError(field, `${label}不能为空`)
  }
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number <= 0 || number > maximum) {
    validationError(field, `${label}必须是 1 到 ${maximum} 之间的整数`)
  }
  return number
}

function nonNegativeNumber(value, field, label) {
  if (value === '' || value === null || value === undefined) {
    validationError(field, `${label}不能为空`)
  }
  const number = Number(value)
  const text = String(value)
  if (
    !Number.isFinite(number) ||
    number < 0 ||
    number > 99999999.99 ||
    !/^\d+(\.\d{1,2})?$/.test(text)
  ) {
    validationError(field, `${label}必须是 0 到 99999999.99 之间、最多两位小数的数字`)
  }
  return number
}

function requiredText(value, field, label, maximumLength = 100) {
  if (typeof value !== 'string' || value.trim() === '') {
    validationError(field, `${label}不能为空`)
  }
  const text = value.trim()
  if (text.length > maximumLength) {
    validationError(field, `${label}不能超过 ${maximumLength} 个字符`)
  }
  return text
}

function dateText(value, field, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    validationError(field, `${label}必须使用 YYYY-MM-DD 格式`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    validationError(field, `${label}不是有效日期`)
  }
  return value
}

function parseBook(body) {
  const input = requireObject(body)
  return {
    isbn: positiveInteger(input.isbn, 'isbn', '书号'),
    title: requiredText(input.title, 'title', '书名'),
    author: requiredText(input.author, 'author', '作者'),
    publisher: requiredText(input.publisher, 'publisher', '出版社'),
    price: nonNegativeNumber(input.price, 'price', '价格')
  }
}

function parseTransaction(body, kind) {
  const input = requireObject(body)
  const isPurchase = kind === 'purchase'
  const quantityField = isPurchase ? 'BuyQuantity' : 'SaleQuantity'
  const amountField = isPurchase ? 'BuyAmount' : 'SaleAmount'
  const dateField = isPurchase ? 'BuyDate' : 'SaleDate'

  return {
    isbn: positiveInteger(input.isbn, 'isbn', '书号'),
    quantity: positiveInteger(input[quantityField], quantityField, '数量'),
    amount: nonNegativeNumber(input[amountField], amountField, '金额'),
    date: dateText(input[dateField], dateField, '日期')
  }
}

function parseIsbn(value) {
  return positiveInteger(value, 'isbn', '书号')
}

function parseYearMonth(body) {
  const input = requireObject(body)
  if (
    typeof input.yearMonth !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.yearMonth)
  ) {
    validationError('yearMonth', '月份必须使用 YYYY-MM 格式')
  }
  return input.yearMonth
}

module.exports = {
  parseBook,
  parseIsbn,
  parseTransaction,
  parseYearMonth
}
