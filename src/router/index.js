import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/Book/base_info'
  },
  {
    path: '/Book/add_base_info',
    name: 'book-add-base-info',
    component: () => import('../views/AddBookBaseInfo.vue')
  },
  {
    path: '/Book/base_info',
    name: 'book-base-info',
    component: () => import('../views/BookBaseInfo.vue')
  },
  {
    path: '/Book/storage_info',
    name: 'book-storage-info',
    component: () => import('../views/BookStorageInfo.vue')
  },
  {
    path: '/Book/add_buy_info',
    name: 'book-add-buy-info',
    component: () => import('../views/BuyInfo.vue')
  },
  {
    path: '/Book/add_sale_info',
    name: 'book-add-sale-info',
    component: () => import('../views/SaleInfo.vue')
  },
  {
    path: '/Book/sale_info',
    name: 'book-sale-info',
    component: () => import('../views/BookSaleInfo.vue')
  },
  {
    path: '/Book/sale_info_month',
    name: 'book-sale-info-month',
    component: () => import('../views/BookSaleInfoMonth.vue')
  },
  {
    path: '*',
    redirect: '/Book/base_info'
  }
]

export default new VueRouter({
  routes
})
