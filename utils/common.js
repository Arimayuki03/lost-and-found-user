/**
 * 格式化日期时间
 * @param {Date|String} date 日期对象或日期字符串
 * @param {String} format 格式化模板，如 'YYYY-MM-DD HH:mm:ss'
 * @returns {String} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();
  
  const padZero = (num) => num < 10 ? '0' + num : num;
  
  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second));
};

/**
 * 计算相对时间（如"3分钟前"、"2小时前"等）
 * @param {Date|String} date 日期对象或日期字符串
 * @returns {String} 相对时间字符串
 */
export const relativeTime = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diff = now - d;
  
  // 转换为秒
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return '刚刚';
  }
  
  // 转换为分钟
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  
  // 转换为小时
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  
  // 转换为天
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }
  
  // 转换为月
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}个月前`;
  }
  
  // 转换为年
  const years = Math.floor(months / 12);
  return `${years}年前`;
};

/**
 * 用户授权与登录管理
 * =================
 */

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export const checkLogin = () => {
  const token = uni.getStorageSync('token');
  return !!token;
};

/**
 * 跳转到登录页面
 */
export const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  });
};

/**
 * 保存授权令牌到本地存储
 * @param {String} token JWT令牌
 */
export const saveToken = (token) => {
  if (!token) return;
  uni.setStorageSync('token', token);
};

/**
 * 退出登录并清除用户凭证
 */
export const logout = () => {
  uni.removeStorageSync('token');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('userInfo');
  
  uni.reLaunch({
    url: '/pages/login/login'
  });
};

/**
 * UI交互与提示封装
 * ===============
 */

/**
 * 显示成功提示框
 * @param {String} message 提示信息
 */
export const showSuccess = (message) => {
  if (!message) return;
  
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  });
};

/**
 * 显示错误提示框
 * @param {String} message 提示信息
 */
export const showError = (message) => {
  if (!message) return;
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 显示加载中提示框
 * @param {String} message 提示信息
 */
export const showLoading = (message = '加载中...') => {
  uni.showLoading({
    title: message,
    mask: true
  });
};

/**
 * 隐藏加载提示框
 */
export const hideLoading = () => {
  uni.hideLoading();
};
// End of Selection