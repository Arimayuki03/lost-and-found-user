import App from './App'
import store from './store'
import api from './utils/api'
import * as utils from './utils/common'
import request from './utils/request'
import messageApi from './api/message'

// Vue 2环境初始化逻辑
// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'

// 关闭生产环境提示
Vue.config.productionTip = false

// 注册全局API和工具
Vue.prototype.$api = api
Vue.prototype.$utils = utils
Vue.prototype.$api.message = messageApi

// 应用启动时，初始化token自动刷新
if (typeof request.setupAutoRefreshToken === 'function') {
  request.setupAutoRefreshToken();
}

// 创建Vue实例并挂载
App.mpType = 'app'
const app = new Vue({
  ...App,
  store
})
app.$mount()
// #endif

// Vue 3环境初始化逻辑
// #ifdef VUE3
import { createSSRApp } from 'vue'

/**
 * 创建Vue 3应用实例
 * 用于SSR(服务端渲染)和CSR(客户端渲染)的通用创建函数
 * @returns {Object} 包含应用实例的对象
 */
export function createApp() {
  // 创建应用实例
  const app = createSSRApp(App)
  
  // 注册Vuex存储
  app.use(store)
  
  // 注册全局API和工具
  app.config.globalProperties.$api = api
  app.config.globalProperties.$utils = utils
  app.config.globalProperties.$api.message = messageApi
  
  // 应用启动时，初始化token自动刷新
  if (typeof request.setupAutoRefreshToken === 'function') {
    request.setupAutoRefreshToken();
  }
  
  return {
    app
  }
}
// #endif