import store from '../store';
import { forceLogout } from './auth';
import { BASE_URL } from '@/config';

// 令牌过期前的刷新阈值(秒)
const TOKEN_REFRESH_THRESHOLD = 300; // 5分钟

/**
 * 纯JS实现的base64解码（不依赖 atob）
 * 微信小程序 / App(JSCore) 端没有 atob 全局函数，必须自行解码
 * @param {string} base64 标准base64字符串（允许省略末尾的 = ）
 * @returns {string} 二进制字符串
 */
function base64ToBinaryString(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let binary = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < base64.length; i++) {
    const val = chars.indexOf(base64.charAt(i));
    if (val === -1) continue; // 跳过 '=' 等非法字符
    buffer = ((buffer << 6) | val) & 0xFFFFFF;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      binary += String.fromCharCode((buffer >> bits) & 0xFF);
    }
  }
  return binary;
}

/**
 * 解析JWT令牌
 * @param {string} token JWT令牌
 * @returns {Object|null} 解析后的令牌载荷或null(解析失败)
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(base64ToBinaryString(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * 检查令牌是否即将过期
 * @returns {boolean} 如果令牌将在阈值时间内过期返回true
 */
function isTokenExpiringSoon() {
  const token = uni.getStorageSync('token');
  if (!token) return false;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  
  return payload.exp - Date.now()/1000 < TOKEN_REFRESH_THRESHOLD;
}

/**
 * 获取令牌剩余有效时间(秒)
 * @returns {number} 剩余有效秒数，无效令牌返回0
 */
function getTokenExpiryTime() {
  const token = uni.getStorageSync('token');
  if (!token) return 0;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;
  
  return Math.max(0, payload.exp - Date.now()/1000);
}

/**
 * 检查令牌是否已过期
 * @returns {boolean} 令牌已过期或不存在时返回true
 */
function isTokenExpired() {
  const token = uni.getStorageSync('token');
  if (!token) return true;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  return payload.exp - Date.now()/1000 <= 0;
}

/**
 * 获取当前用户ID
 * @returns {string|null} 当前用户ID或null(未登录)
 */
function getCurrentUserId() {
  const token = uni.getStorageSync('token');
  if (!token) return null;
  
  const payload = parseJwt(token);
  return payload ? payload.sub || payload.user_id : null;
}

// 刷新令牌的Promise缓存，用于避免多个请求同时触发刷新
let refreshTokenPromise = null;

/**
 * 单例模式刷新令牌，避免并发刷新请求
 * @returns {Promise} 刷新结果Promise
 */
async function refreshTokenSingleton() {
  if (!refreshTokenPromise) {
    refreshTokenPromise = store.dispatch('refreshToken')
      .finally(() => {
        refreshTokenPromise = null;
      });
  }
  return refreshTokenPromise;
}

// 自动刷新令牌的定时器ID
let autoRefreshTimerId = null;

/**
 * 设置自动刷新令牌的定时器
 * 基于令牌的过期时间，设置提前刷新的定时器
 */
function setupAutoRefreshToken() {
  // 清除之前的定时器
  if (autoRefreshTimerId) {
    clearTimeout(autoRefreshTimerId);
    autoRefreshTimerId = null;
  }
  
  // 检查是否有令牌
  const token = uni.getStorageSync('token');
  if (!token) return;
  
  // 获取令牌过期时间(秒)
  const expiryTime = getTokenExpiryTime();
  if (expiryTime <= 0) return;
  
  // 计算下次刷新时间(提前阈值时间刷新)
  const refreshDelay = Math.max(0, (expiryTime - TOKEN_REFRESH_THRESHOLD) * 1000);
  
  // 设置定时器
  autoRefreshTimerId = setTimeout(async () => {
    try {
      // 再次检查令牌是否即将过期
      if (isTokenExpiringSoon()) {
        await refreshTokenSingleton();
      }
    } catch (error) {
      // 刷新失败，下次应用启动时会再次尝试
    } finally {
      // 无论成功失败，都重新设置定时器
      setupAutoRefreshToken();
    }
  }, refreshDelay);
}

// 初始化自动刷新令牌
setupAutoRefreshToken();

/**
 * 将对象转换为URL查询字符串
 * @param {Object} obj 要转换的对象
 * @returns {string} 查询字符串，以?开头
 */
function objectToQueryString(obj) {
  if (!obj || Object.keys(obj).length === 0) return '';
  
  const parts = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
      const value = encodeURIComponent(obj[key]);
      parts.push(`${encodeURIComponent(key)}=${value}`);
    }
  }
  
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

/**
 * 处理未授权错误：统一走 utils/auth.js 的 forceLogout
 * （清凭证 + 关 Socket.IO 长连接 + 重置 Vuex 登录态 + 跳转登录页）
 */
function handleUnauthorized() {
  forceLogout();
}

/**
 * 请求拦截器及主要请求函数
 * @param {Object} options 请求配置
 * @param {string} options.url 请求路径
 * @param {string} options.method 请求方法
 * @param {Object} [options.data] 请求数据
 * @param {Object} [options.header] 请求头
 * @param {number} [_retryCount=0] 401 重试次数（内部参数，最多重试1次）
 * @returns {Promise} 请求结果Promise
 */
const request = async (options, _retryCount = 0) => {
  const isRefreshRequest = options.url.includes('/common/refresh');
  const isLoginRequest = options.url.includes('/user/login');
  
  // 如果令牌已过期且不是刷新或登录请求，尝试刷新令牌
  if (isTokenExpired() && !isRefreshRequest && !isLoginRequest) {
    try {
      await refreshTokenSingleton();
      // 刷新成功后，重新设置自动刷新定时器
      setupAutoRefreshToken();
    } catch (error) {
      handleUnauthorized();
      return Promise.reject({ message: '登录已过期' });
    }
  }
  // 令牌即将过期且不是刷新或登录请求
  else if (isTokenExpiringSoon() && !isRefreshRequest && !isLoginRequest) {
    try {
      await refreshTokenSingleton();
      setupAutoRefreshToken();
    } catch (error) {
      // 刷新失败但令牌未完全过期，继续使用当前令牌
    }
  }
  
  // 获取令牌
  const token = uni.getStorageSync('token');
  
  // 处理查询参数（URL 已含查询串时用 & 续接，避免出现第二个 ?）
  let url = options.url;
  let shouldDropData = false;
  if (options.data && options.method === 'GET') {
    const query = objectToQueryString(options.data);
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query.slice(1);
    }
    // GET 参数已手工序列化进 URL，置空 data 避免 uni.request 再拼一次导致参数重复
    shouldDropData = true;
  }

  // 添加基础URL
  if (!url.startsWith('http')) {
    // 防御：BASE_URL 为空（如生产未配置地址）时请求会打到同源相对路径，直接显式失败
    if (!BASE_URL) {
      return Promise.reject(new Error('后端地址未配置'));
    }
    url = BASE_URL + url;
  }

  // 构建请求配置
  const requestOptions = {
    ...options,
    url: url,
    header: {
      'Content-Type': 'application/json',
      ...options.header
    }
  };
  if (shouldDropData) {
    requestOptions.data = undefined;
  }
  
  // 添加认证头
  if (token && !isRefreshRequest) {
    requestOptions.header['Authorization'] = 'Bearer ' + token;
  } else if (isRefreshRequest) {
    // 刷新令牌请求使用refreshToken
    const refreshToken = uni.getStorageSync('refreshToken');
    if (refreshToken) {
      requestOptions.header['Authorization'] = 'Bearer ' + refreshToken;
    }
  }
  
  // 发送请求
  return new Promise((resolve, reject) => {
    uni.request({
      ...requestOptions,
      success: (res) => {
        // 请求成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } 
        // 未授权
        else if (res.statusCode === 401) {
          // 如果不是刷新令牌请求且尚未重试过，尝试刷新令牌后重试一次
          if (!isRefreshRequest && !isLoginRequest && _retryCount < 1) {
            refreshTokenSingleton().then(() => {
              // 刷新成功，重试请求（带重试计数，防止无限刷新循环）
              setupAutoRefreshToken();
              request(options, _retryCount + 1).then(resolve).catch(reject);
            }).catch(() => {
              handleUnauthorized();
              reject({ message: '登录已过期' });
            });
          } else {
            // 刷新令牌请求本身返回401，直接拒绝
            reject(res.data);
          }
        } 
        // 权限不足
        else if (res.statusCode === 403) {
          uni.showToast({
            title: res.data.error || '您没有权限执行此操作',
            icon: 'none'
          });
          reject(res.data);
        } 
        // 其他错误
        else {
          uni.showToast({
            title: res.data.error || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        // 网络错误
        uni.showToast({
          title: '网络连接失败，请检查网络设置',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// 监听应用启动和恢复
uni.onAppShow(() => {
  // 应用启动或从后台恢复时，检查令牌并设置自动刷新
  setupAutoRefreshToken();
});

/**
 * 统一文件上传方法（uni.uploadFile 封装）
 * 与 request 相同的令牌处理：过期先刷新、401 后刷新重试一次
 * @param {Object} options 上传配置
 * @param {string} options.url 请求路径
 * @param {string} options.filePath 本地文件路径
 * @param {string} [options.name='file'] 文件字段名
 * @param {Object} [options.formData] 附加表单数据
 * @param {number} [_retryCount=0] 401 重试次数（内部参数，最多重试1次）
 * @returns {Promise} 上传结果Promise（resolve 解析后的 JSON 响应）
 */
const uploadFile = async (options, _retryCount = 0) => {
  // 令牌过期/将过期时先刷新（与 request 保持一致）
  if (!options.url.includes('/user/login') && (isTokenExpired() || isTokenExpiringSoon())) {
    try {
      await refreshTokenSingleton();
      setupAutoRefreshToken();
    } catch (error) {
      if (isTokenExpired()) {
        handleUnauthorized();
        return Promise.reject({ message: '登录已过期' });
      }
    }
  }

  const token = uni.getStorageSync('token');
  let url = options.url;
  if (!url.startsWith('http')) {
    // 防御：BASE_URL 为空（如生产未配置地址）时上传会打到同源相对路径，直接显式失败
    if (!BASE_URL) {
      return Promise.reject(new Error('后端地址未配置'));
    }
    url = BASE_URL + url;
  }

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      ...options,
      url: url,
      name: options.name || 'file',
      header: {
        ...(options.header || {}),
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // uploadFile 返回字符串，需解析为 JSON
          let data = res.data;
          try {
            data = JSON.parse(res.data);
          } catch (e) { /* 非 JSON 响应原样返回 */ }
          resolve(data);
        } else if (res.statusCode === 401 && !options.url.includes('/user/login') && _retryCount < 1) {
          // 令牌在请求途中过期：刷新后重试一次
          refreshTokenSingleton().then(() => {
            setupAutoRefreshToken();
            uploadFile(options, _retryCount + 1).then(resolve).catch(reject);
          }).catch(() => {
            handleUnauthorized();
            reject({ message: '登录已过期' });
          });
        } else {
          let data = res.data;
          try {
            data = JSON.parse(res.data);
          } catch (e) { /* 保持原始字符串 */ }
          uni.showToast({
            title: (data && data.error) || '请求失败',
            icon: 'none'
          });
          reject(data);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络连接失败，请检查网络设置',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// 导出request和setupAutoRefreshToken函数
const requestModule = request;
requestModule.setupAutoRefreshToken = setupAutoRefreshToken;
requestModule.uploadFile = uploadFile;

export default requestModule;