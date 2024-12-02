//index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import CreateArticle from '../views/CreateArticle.vue'
import ListArticle from '../views/ListArticle.vue'
import BuyInfo from '../views/BuyInfo.vue'
import SaleInfo from '../views/SaleInfo.vue'
import BookSaleInfo from '../views/BookSaleInfo.vue'
import BookSaleInfoMonth from '../views/BookSaleInfoMonth.vue'
import AddBookBaseInfo from '../views/AddBookBaseInfo.vue'
import BookStorageInfo from '../views/BookStorageInfo.vue'
import BookBaseInfo from '../views/BookBaseInfo.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/Book/base_info'
  },
  {
    path: '/articles/index',
    name: 'list-article',
    component: ListArticle
  },
  {
    path: '/articles/create',
    name: 'create-article',
    component: CreateArticle
  },
  {
    path: '/Book/add_base_info',
    name: 'book-add_base_info',
    component: AddBookBaseInfo
  },
  {
    path: '/Book/base_info',
    name: 'book-base_info',
    component: BookBaseInfo
  },
  {
    path: '/Book/storage_info',
    name: 'book-storage_info',
    component: BookStorageInfo
  },
  {
    path: '/Book/add_buy_info',
    name: 'book-add_buy_info',
    component: BuyInfo
  },
  {
    path: '/Book/add_sale_info',
    name: 'book-add_sale_info',
    component: SaleInfo
  },
  {
    path: '/Book/sale_info',
    name: 'book-book_sale_info',
    component: BookSaleInfo
  },
  {
    path: '/Book/sale_info_month',
    name: 'book-book_sale_info_month',
    component: BookSaleInfoMonth
  }
]

const router = new VueRouter({
  routes
})

export default router
