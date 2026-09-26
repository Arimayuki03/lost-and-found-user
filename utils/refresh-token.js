import { BASE_URL } from '@/config';
import { forceLogout as unifiedForceLogout } from './auth';

/**
 * 全局唯一的刷新令牌单例（request.js 与 api.js 共用）。
 *
 * 此前 utils/request.js（refreshTokenSingleton，经 store.dispatch('refreshToken')
 * → api.user.refreshToken 发请求）与 utils/api.js（refreshOnce，自建 uni.request）
 * 各自维护互不感知的刷新单例：令牌临期时两栈请求可并发用同一个 refreshToken
 * 打两次 /common/refresh。收敛到本模块后，任何一路触发刷新都复用同一条在途
 * Promise，请求栈差异不再产生并发刷新。
 *
 * 写回凭证前会校验 refreshToken 快照：发起刷新后用户可能恰好登出（凭证已清），
 * 若无条件写回会把已登出设备"复活"出有效登录态，属于登出语义被破坏。
 */

// 在途刷新 Promise（跨模块共享，保证单例）
let refreshInFlight = null;

export function isRefreshInFlight() {
  return !!refreshInFlight;
}

export function sharedRefreshToken() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = uni.getStorageSync('refreshToken');
  if (!refreshToken) {
    return Promise.reject('没有刷新令牌');
  }

  refreshInFlight = new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + '/common/refresh',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + refreshToken,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.access_token) {
          // 登出竞态防护：发起时记下的 refreshToken 若已被清除/更换（登出会清除、
          // 另一路刷新会轮换），本结果属于过期会话，丢弃不写，避免"复活"已登出设备
          if (uni.getStorageSync('refreshToken') !== refreshToken) {
            reject({ message: '登录状态已变更，丢弃本次刷新结果' });
            return;
          }
          uni.setStorageSync('token', res.data.access_token);
          if (res.data.refresh_token) {
            uni.setStorageSync('refreshToken', res.data.refresh_token);
          }
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // refresh token 已失效：走统一登出管道（清凭证 + 关 Socket + 重置 Vuex + 跳登录页），
          // 不在此处内联旧版"只清 storage + toast + reLaunch"的不完整登出
          unifiedForceLogout();
          reject(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: reject
    });
  });

  // 单例复位的写法与 request.js/api.js 原实现一致：
  // .finally 的返回值必须赋回单例变量，否则失败链上的 rejection 无人处理
  refreshInFlight = refreshInFlight.finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
