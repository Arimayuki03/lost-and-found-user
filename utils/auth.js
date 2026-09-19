import socketIOService from './socketio';
import { updateMessageBadge } from './common';

/**
 * 统一登出（登录态失效 401 专用）
 * ============================================================
 * 此前 401 的登出副作用分散在两处且各自不完整：
 * - utils/request.js 的 handleUnauthorized：清 storage + 关 Socket.IO，但不重置 Vuex；
 * - utils/api.js 的 forceLogout：仅清 storage，既不关 Socket.IO 也不重置 Vuex
 *   （socketio.js 的 reconnectionAttempts 为 Infinity，旧连接会一直存活重连）。
 * 现统一收敛到本函数，依次完成：
 *   1. 清除本地登录凭证（token/refreshToken/userInfo，为上述两处清理键集合的并集）；
 *   2. 关闭携带旧令牌的 Socket.IO 长连接；
 *   3. 动态引入 store 并 commit CLEAR_USER_INFO 重置 Vuex 登录态；
 *   4. 提示"登录已过期"并跳转登录页（保留原有提示文案、延时与目标 URL）。
 *
 * 依赖方向说明（如何避免循环依赖）：
 * - socketio.js 静态引入：socketio 依赖 store/config/common，不依赖本文件，
 *   与 request.js 此前静态引入 socketio 的拓扑一致，不构成新的循环；
 * - store 动态引入（import('@/store/index.js')）：若静态引入会形成
 *   store → api/request → auth → store 的循环依赖，故延后到调用时再取。
 */

// 本地登录凭证键集合（request.js handleUnauthorized 与 api.js forceLogout 原有清理键的并集）
const AUTH_STORAGE_KEYS = ['token', 'refreshToken', 'userInfo'];

/**
 * 执行统一登出：清凭证、关长连接、重置 Vuex、跳转登录页
 */
export const forceLogout = () => {
  // 1. 清除本地凭证
  AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      uni.removeStorageSync(key);
    } catch (e) {
      // 个别端存储异常时忽略，继续后续清理
    }
  });

  // 2. 关闭携带旧令牌的 Socket.IO 长连接，避免退出后仍收发消息或无限重连
  try {
    socketIOService.close();
  } catch (e) {
    // socket 服务未初始化时忽略
  }

  // 2.1 清除"消息"tabBar 未读角标（与 utils/common.js updateMessageBadge 设置角标对称），
  //     传入 0 走 removeTabBarBadge 分支；当前页非 tabBar 页等场景失败时静默
  try {
    updateMessageBadge(0);
  } catch (e) {
    // 角标清除失败不影响登出流程
  }

  // 3. 重置 Vuex 登录态（动态引入避免循环依赖；store 未就绪时静默，不影响跳转）
  import('@/store/index.js')
    .then((module) => {
      try {
        module.default.commit('CLEAR_USER_INFO');
      } catch (e) {
        // store 未就绪等异常时忽略
      }
    })
    .catch(() => {});

  // 4. 提示并跳转登录页
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  });

  setTimeout(() => {
    // reLaunch 避免在已有页面上反复叠加登录页
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (!current || current.route !== 'pages/login/login') {
      uni.reLaunch({
        url: '/pages/login/login'
      });
    }
  }, 1500);
};

export default forceLogout;
