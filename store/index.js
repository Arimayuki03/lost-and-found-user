import { createStore } from 'vuex';
import api from '../utils/api.js';
import { saveToken } from '../utils/common.js';
import request from '../utils/request.js';
import { sharedRefreshToken } from '../utils/refresh-token.js';

/**
 * 创建Vuex状态管理实例
 */
const store = createStore({
  /**
   * 全局状态定义
   */
  state: {
    // 用户信息
    userInfo: null,
    // 是否已登录
    isLoggedIn: !!uni.getStorageSync('token'),
    // 失物列表
    lostItems: [],
    // 招领列表
    foundItems: [],
    // 聊天列表
    chatList: [],
    // 公告列表
    announcements: [],
    // 轮播图列表
    carouselImages: []
  },
  
  /**
   * 状态变更方法
   * 所有对状态的直接修改都必须通过这些方法
   */
  mutations: {
    // 设置用户信息
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo;
      state.isLoggedIn = true;
    },
    
    // 清除用户信息
    CLEAR_USER_INFO(state) {
      state.userInfo = null;
      state.isLoggedIn = false;
      uni.removeStorageSync('token');
      uni.removeStorageSync('refreshToken');
      // 一并重置业务列表状态：登出后这些数据属上个账号，跨账号残留会泄露给下一个登录用户
      // （carouselImages 为公共内容，保留不清）
      state.lostItems = [];
      state.foundItems = [];
      state.chatList = [];
      state.announcements = [];
    },
    
    // 设置失物列表
    SET_LOST_ITEMS(state, items) {
      state.lostItems = items;
    },
    
    // 设置招领列表
    SET_FOUND_ITEMS(state, items) {
      state.foundItems = items;
    },
    
    // 设置聊天列表
    SET_CHAT_LIST(state, list) {
      state.chatList = list;
    },
    
    // 设置公告列表
    SET_ANNOUNCEMENTS(state, list) {
      state.announcements = list;
    },
    
    // 设置轮播图列表
    SET_CAROUSEL_IMAGES(state, list) {
      state.carouselImages = list;
    }
  },
  
  /**
   * 异步操作和业务逻辑处理
   * 包含所有的API调用和复杂状态更新
   */
  actions: {
    /**
     * 用户登录
     * @param {Object} data 登录数据，包含用户名和密码
     * @returns {Promise} 登录结果
     */
    async login({ commit }, data) {
      try {
        const res = await api.user.login(data);
        if (res.access_token) {
          saveToken(res.access_token);
          if (res.refresh_token) {
            uni.setStorageSync('refreshToken', res.refresh_token);
          }
          
          // 如果响应中包含用户信息，直接保存
          if (res.user) {
            commit('SET_USER_INFO', res.user);
          } else {
            // 否则，调用获取用户信息接口
            try {
              const userRes = await api.user.getUserInfo();
              if (userRes.user) {
                commit('SET_USER_INFO', userRes.user);
              }
            } catch (userError) {
              // 获取用户信息失败，但登录仍然成功
            }
          }
          
          // 登录成功后，设置自动刷新token定时器
          if (typeof request.setupAutoRefreshToken === 'function') {
            request.setupAutoRefreshToken();
          }
          
          return res;
        }
        return Promise.reject(res);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 用户注册
     * @param {Object} data 注册数据
     * @returns {Promise} 注册结果
     */
    async register(_, data) {
      try {
        return await api.user.register(data);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 重置密码
     * @param {Object} data 重置密码所需数据
     * @returns {Promise} 重置结果
     */
    async resetPassword(_, data) {
      try {
        return await api.user.resetPassword(data);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取验证码
     * @param {string} email 邮箱地址
     * @returns {Promise} 获取结果
     */
    async getCode(_, email) {
      try {
        return await api.user.getCode(email);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 检查邮箱是否已注册
     * @param {string} email 邮箱地址
     * @returns {Promise} 检查结果
     */
    async checkEmail(_, email) {
      try {
        return await api.user.checkEmail(email);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取用户信息
     * @returns {Promise} 用户信息
     */
    async getUserInfo({ commit }) {
      try {
        const res = await api.user.getUserInfo();
        if (res.user) {
          commit('SET_USER_INFO', res.user);
        } else if (res.name && res.student_id) {
          // 如果响应本身就是用户信息对象
          commit('SET_USER_INFO', res);
        }
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 更新用户信息
     * @param {Object} data 用户信息数据
     * @returns {Promise} 更新结果
     */
    async updateUserInfo({ dispatch }, data) {
      try {
        const res = await api.user.updateUserInfo(data);
        if (res.message) {
          // 更新成功后，重新获取用户信息
          await dispatch('getUserInfo');
        }
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 更新用户头像
     * @param {Object} data 头像数据
     * @returns {Promise} 更新结果
     */
    async updateAvatar({ dispatch }, data) {
      try {
        const res = await api.user.updateAvatar(data);
        if (res.message) {
          // 更新成功后，重新获取用户信息
          await dispatch('getUserInfo');
        }
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 更新用户邮箱
     * @param {Object} data 邮箱更新数据
     * @returns {Promise} 更新结果
     */
    async updateEmail({ dispatch }, data) {
      try {
        const res = await api.user.updateEmail(data);
        if (res.message) {
          // 更新成功后，重新获取用户信息
          await dispatch('getUserInfo');
        }
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 退出登录
     */
    logout({ commit }) {
      commit('CLEAR_USER_INFO');
    },
    
    /**
     * 获取失物列表
     * @param {Object} params 查询参数
     * @returns {Promise} 查询结果
     */
    async getLostItems({ commit }, params) {
      try {
        const res = await api.lostItem.getList(params);
        commit('SET_LOST_ITEMS', res.items || []);
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取招领列表
     * @param {Object} params 查询参数
     * @returns {Promise} 查询结果
     */
    async getFoundItems({ commit }, params) {
      try {
        const res = await api.foundItem.getList(params);
        commit('SET_FOUND_ITEMS', res.items || []);
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取聊天联系人列表
     * 后端 /user/chat/contacts 返回裸数组（无联系人时返回 {message}）
     * @returns {Promise} 联系人列表
     */
    async getChatList({ commit }) {
      try {
        const res = await api.message.getChatContacts();
        const contacts = Array.isArray(res) ? res : (res.contacts || []);
        commit('SET_CHAT_LIST', contacts);
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取公告列表
     * 后端 /common/announcements 返回 { items, total }
     * @returns {Promise} 公告列表
     */
    async getAnnouncements({ commit }) {
      try {
        const res = await api.announcement.getList();
        commit('SET_ANNOUNCEMENTS', res.items || res.announcements || []);
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取轮播图列表
     * @returns {Promise} 轮播图列表
     */
    async getCarouselImages({ commit }) {
      try {
        const res = await api.carousel.getList();
        commit('SET_CAROUSEL_IMAGES', res.items || []);
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 刷新token（统一走 utils/refresh-token.js 的共享单例）。
     * 原实现先 api.user.refreshToken 再写回 storage，无"发起后是否已登出"的守卫：
     * 刷新在途期间用户登出（凭证已清），返回后会把新令牌写回已登出设备，
     * 登出语义被破坏。共享单例内部已做 refreshToken 快照校验，此处不再重复写回。
     * @returns {Promise} 刷新结果
     */
    async refreshToken() {
      return sharedRefreshToken();
    },
    
    /**
     * 提交反馈
     * @param {Object} data 反馈内容
     * @returns {Promise} 提交结果
     */
    async submitFeedback(_, data) {
      try {
        return await api.feedback.submit(data);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    /**
     * 获取我的反馈记录
     * @returns {Promise} 反馈记录
     */
    async getMyFeedbackList() {
      try {
        return await api.feedback.getMyList();
      } catch (error) {
        return Promise.reject(error);
      }
    }
  },
  
  /**
   * 状态派生计算
   * 提供对状态的便捷访问
   */
  getters: {
    // 用户信息
    userInfo: state => state.userInfo,
    // 是否已登录
    isLoggedIn: state => state.isLoggedIn,
    // 失物列表
    lostItems: state => state.lostItems,
    // 招领列表
    foundItems: state => state.foundItems,
    // 聊天列表
    chatList: state => state.chatList,
    // 公告列表
    announcements: state => state.announcements,
    // 轮播图列表
    carouselImages: state => state.carouselImages
  }
});

export default store; 