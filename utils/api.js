import { BASE_URL } from '@/config';

/**
 * 统一请求方法
 * 
 * @param {Object} options 请求配置项
 * @param {string} options.url 请求路径
 * @param {string} options.method 请求方法
 * @param {Object} [options.data] 请求数据
 * @param {Object} [options.header] 自定义请求头
 * @returns {Promise} 请求结果Promise
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = uni.getStorageSync('token');
    
    // 合并选项
    const requestOptions = {
      ...options,
      url: BASE_URL + options.url,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      }
    };
    
    // 如果有token，添加到请求头
    if (token) {
      requestOptions.header['Authorization'] = 'Bearer ' + token;
    }
    
    // 发送请求
    uni.request({
      ...requestOptions,
      success: (res) => {
        // 请求成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权：清除全部登录凭证（与 utils/request.js 的 handleUnauthorized 保持一致）
          uni.removeStorageSync('token');
          uni.removeStorageSync('refreshToken');
          uni.removeStorageSync('userInfo');

          // 登录/注册/刷新接口本身返回 401 属于业务失败（如密码错误），
          // 不做"登录已过期"提示与跳转，由调用方展示错误
          const isAuthFreeRequest = ['/user/login', '/user/register', '/common/refresh']
            .some(path => options.url.includes(path));

          if (!isAuthFreeRequest) {
            uni.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              // reLaunch 避免登录页反复入栈
              const pages = getCurrentPages();
              const current = pages[pages.length - 1];
              if (!current || current.route !== 'pages/login/login') {
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }
            }, 1500);
          }
          reject(res.data);
        } else if (res.statusCode === 403) {
          // 权限不足
          uni.showToast({
            title: res.data.error || '您没有权限执行此操作',
            icon: 'none'
          });
          reject(res.data);
        } else {
          // 其他错误
          uni.showToast({
            title: res.data.error || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        // 请求失败
        uni.showToast({
          title: '网络连接失败，请检查网络设置',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

/**
 * API接口集合
 */
const api = {
  /**
   * 用户相关接口
   */
  user: {
    /**
     * 用户登录
     * @param {Object} data 登录数据
     * @returns {Promise} 登录结果
     */
    login: (data) => {
      return request({
        url: '/user/login',
        method: 'POST',
        data
      });
    },
    
    /**
     * 用户注册
     * @param {Object} data 注册数据
     * @returns {Promise} 注册结果
     */
    register: (data) => {
      return request({
        url: '/user/register',
        method: 'POST',
        data
      });
    },
    
    /**
     * 获取验证码
     * @param {string} email 邮箱地址
     * @returns {Promise} 获取结果
     */
    getCode: (email) => {
      return request({
        url: '/common/emails/verification',
        method: 'POST',
        data: { email }
      });
    },
    
    /**
     * 检查邮箱是否已注册
     * @param {string} email 邮箱地址
     * @returns {Promise} 检查结果
     */
    checkEmail: (email) => {
      return request({
        url: '/common/emails',
        method: 'POST',
        data: { email }
      });
    },
    
    /**
     * 检查学号是否已注册
     * @param {string} student_id 学号
     * @returns {Promise} 检查结果
     */
    checkStudentId: (student_id) => {
      return request({
        url: '/common/student-ids',
        method: 'POST',
        data: { student_id }
      });
    },
    
    /**
     * 获取当前用户信息
     * @returns {Promise} 用户信息
     */
    getUserInfo: () => {
      return request({
        url: '/user/profile',
        method: 'GET'
      });
    },
    
    /**
     * 更新用户信息
     * @param {Object} data 用户信息数据
     * @returns {Promise} 更新结果
     */
    updateUserInfo: (data) => {
      return request({
        url: '/user/profile',
        method: 'PUT',
        data
      });
    },
    
    /**
     * 更新用户头像
     * @param {Object} data 头像数据
     * @returns {Promise} 更新结果
     */
    updateAvatar: (data) => {
      return request({
        url: '/user/avatar',
        method: 'PUT',
        data
      });
    },
    
    /**
     * 更新用户邮箱
     * @param {Object} data 邮箱数据
     * @returns {Promise} 更新结果
     */
    updateEmail: (data) => {
      return request({
        url: '/user/email',
        method: 'POST',
        data
      });
    },
    
    /**
     * 重置密码
     * @param {Object} data 重置密码数据
     * @returns {Promise} 重置结果
     */
    resetPassword: (data) => {
      return request({
        url: '/user/password',
        method: 'POST',
        data
      });
    },
    
    /**
     * 获取指定ID的用户信息
     * @param {string|number} userId 用户ID
     * @returns {Promise} 用户信息
     */
    getUserById: (userId) => {
      return request({
        url: `/user/profile/${userId}`,
        method: 'GET'
      });
    },
    
    /**
     * 刷新授权令牌
     * @returns {Promise} 刷新结果
     */
    refreshToken: () => {
      const refreshToken = uni.getStorageSync('refreshToken');
      if (!refreshToken) {
        return Promise.reject('没有刷新令牌');
      }
      
      return new Promise((resolve, reject) => {
        uni.request({
          url: BASE_URL + '/common/refresh',
          method: 'POST',
          header: {
            'Authorization': 'Bearer ' + refreshToken,
            'Content-Type': 'application/json'
          },
          success: (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              if (res.data.access_token) {
                // 保存新的access token
                uni.setStorageSync('token', res.data.access_token);
                // 如果有新的refresh token，也保存
                if (res.data.refresh_token) {
                  uni.setStorageSync('refreshToken', res.data.refresh_token);
                }
                resolve(res.data);
              } else {
                reject({ message: '刷新token失败' });
              }
            } else {
              // 如果是401错误，说明refresh token已过期，需要重新登录
              if (res.statusCode === 401) {
                uni.removeStorageSync('token');
                uni.removeStorageSync('refreshToken');
                uni.showToast({
                  title: '登录已过期，请重新登录',
                  icon: 'none'
                });
                setTimeout(() => {
                  const pages = getCurrentPages();
                  const current = pages[pages.length - 1];
                  if (!current || current.route !== 'pages/login/login') {
                    uni.reLaunch({
                      url: '/pages/login/login'
                    });
                  }
                }, 1500);
              }
              reject(res.data);
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    }
  },
  
  /**
   * 搜索相关接口
   */
  search: {
    /**
     * 统一搜索接口
     * @param {Object} params 搜索参数
     * @returns {Promise} 搜索结果
     */
    searchItems: (params) => {
      return request({
        url: '/common/search',
        method: 'GET',
        data: params
      });
    }
  },
  
  /**
   * 失物相关接口
   */
  lostItem: {
    /**
     * 获取失物列表
     * @param {Object} params 查询参数
     * @returns {Promise} 失物列表
     */
    getList: (params) => {
      return request({
        url: '/common/lost-items',
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 筛选失物列表
     * @param {Object} params 筛选参数
     * @returns {Promise} 筛选结果
     */
    sift: (params) => {
      return request({
        url: '/common/lost-items/sift',
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 获取失物详情
     * @param {string|number} id 失物ID
     * @returns {Promise} 失物详情
     */
    getDetail: (id) => {
      return request({
        url: `/common/lost-items/${id}`,
        method: 'GET'
      });
    },
    
    /**
     * 发布失物信息
     * @param {Object} data 失物数据
     * @returns {Promise} 发布结果
     */
    publish: (data) => {
      return request({
        url: '/user/lost-items',
        method: 'POST',
        data
      });
    },
    
    /**
     * 更新失物信息
     * @param {string|number} id 失物ID
     * @param {Object} data 更新数据
     * @returns {Promise} 更新结果
     */
    update: (id, data) => {
      return request({
        url: `/user/lost-items/${id}`,
        method: 'PUT',
        data
      });
    },
    
    /**
     * 删除失物信息
     * @param {string|number} id 失物ID
     * @returns {Promise} 删除结果
     */
    delete: (id) => {
      return request({
        url: `/user/lost-items/${id}`,
        method: 'DELETE'
      });
    },
    
    /**
     * 获取我的失物列表
     * @returns {Promise} 我的失物列表
     */
    getMyList: () => {
      return request({
        url: '/user/lost-items',
        method: 'GET'
      });
    }
  },
  
  /**
   * 招领相关接口
   */
  foundItem: {
    /**
     * 获取招领列表
     * @param {Object} params 查询参数
     * @returns {Promise} 招领列表
     */
    getList: (params) => {
      return request({
        url: '/common/found-items',
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 筛选招领列表
     * @param {Object} params 筛选参数
     * @returns {Promise} 筛选结果
     */
    sift: (params) => {
      return request({
        url: '/common/found-items/sift',
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 获取招领详情
     * @param {string|number} id 招领ID
     * @returns {Promise} 招领详情
     */
    getDetail: (id) => {
      return request({
        url: `/common/found-items/${id}`,
        method: 'GET'
      });
    },
    
    /**
     * 发布招领信息
     * @param {Object} data 招领数据
     * @returns {Promise} 发布结果
     */
    publish: (data) => {
      return request({
        url: '/user/found-items',
        method: 'POST',
        data
      });
    },
    
    /**
     * 更新招领信息
     * @param {string|number} id 招领ID
     * @param {Object} data 更新数据
     * @returns {Promise} 更新结果
     */
    update: (id, data) => {
      return request({
        url: `/user/found-items/${id}`,
        method: 'PUT',
        data
      });
    },
    
    /**
     * 删除招领信息
     * @param {string|number} id 招领ID
     * @returns {Promise} 删除结果
     */
    delete: (id) => {
      return request({
        url: `/user/found-items/${id}`,
        method: 'DELETE'
      });
    },
    
    /**
     * 获取我的招领列表
     * @returns {Promise} 我的招领列表
     */
    getMyList: () => {
      return request({
        url: '/user/found-items',
        method: 'GET'
      });
    }
  },
  
  /**
   * 消息相关接口
   */
  message: {
    /**
     * 获取聊天联系人列表
     * @returns {Promise} 联系人列表
     */
    getChatContacts: () => {
      return request({
        url: '/user/chat/contacts',
        method: 'GET'
      });
    },
    
    /**
     * 获取聊天列表（向后兼容）
     * @returns {Promise} 聊天列表
     * @deprecated 使用getChatContacts替代
     */
    getChatList: () => {
      return request({
        url: '/user/chat-list',
        method: 'GET'
      });
    },
    
    /**
     * 获取聊天历史记录
     * @param {string|number} userId 对方用户ID
     * @param {Object} params 查询参数
     * @returns {Promise} 聊天记录
     * @deprecated 端点已与 api/message.js 对齐，请优先使用 $api.message（api/message.js）
     */
    getChatHistory: (userId, params = {}) => {
      return request({
        url: `/user/chat/history/${encodeURIComponent(userId)}`,
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 发送消息
     * @param {Object} data 消息数据
     * @returns {Promise} 发送结果
     */
    sendMessage: (data) => {
      return request({
        url: '/user/send',
        method: 'POST',
        data
      });
    },
    
    /**
     * 标记消息已读
     * @param {string|number} messageId 消息ID
     * @returns {Promise} 标记结果
     */
    markAsRead: (messageId) => {
      return request({
        url: `/user/read/${messageId}`,
        method: 'POST'
      });
    },
    
    /**
     * 获取未读消息数量
     * @returns {Promise} 未读数量
     */
    getUnreadCount: () => {
      return request({
        url: '/user/chat/unread-count',
        method: 'GET'
      });
    }
  },
  
  /**
   * 反馈相关接口
   */
  feedback: {
    /**
     * 提交反馈
     * @param {Object} data 反馈数据
     * @returns {Promise} 提交结果
     */
    submit: (data) => {
      return request({
        url: '/user/feedback',
        method: 'POST',
        data
      });
    },
    
    /**
     * 获取我的反馈记录
     * @returns {Promise} 反馈列表
     */
    getMyList: () => {
      return request({
        url: '/user/feedback',
        method: 'GET'
      });
    }
  },
  
  /**
   * 公告相关接口
   */
  announcement: {
    /**
     * 获取公告列表
     * @param {Object} params 查询参数
     * @returns {Promise} 公告列表
     */
    getList: (params) => {
      return request({
        url: '/common/announcements',
        method: 'GET',
        data: params
      });
    },
    
    /**
     * 获取公告详情
     * @param {string|number} id 公告ID
     * @returns {Promise} 公告详情
     */
    getDetail: (id) => {
      return request({
        url: `/common/announcements/${id}`,
        method: 'GET'
      });
    }
  },
  
  /**
   * 轮播图相关接口
   */
  carousel: {
    /**
     * 获取轮播图列表
     * @returns {Promise} 轮播图列表
     */
    getList: () => {
      return request({
        url: '/common/carousel-images',
        method: 'GET'
      });
    }
  }
};

export default api; 