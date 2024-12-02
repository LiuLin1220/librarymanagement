//main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element.js'

Vue.config.productionTip = false

import axios from 'axios' //用来请求接口的。前后端都可以用axios请求接口。没有安装axios的需要安装下npm install axios
Vue.prototype.$http = axios.create({
  baseURL: 'http://localhost:3001/api'//填写后端接口，后面有后端接口的样例
})//可以在任意页面使用this.$http访问axios实例

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
