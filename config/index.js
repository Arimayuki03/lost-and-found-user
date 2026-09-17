/**
 * 全局配置（唯一后端地址配置点）
 * 全项目通过 `import { BASE_URL } from '@/config'` 引用，部署时只需修改本文件的地址常量。
 */

// 开发环境：本机后端（HBuilderX "运行" 模式使用）
const DEV_BASE_URL = 'http://127.0.0.1:5000';

// 生产环境：必须填入线上 HTTPS 地址（例如 'https://api.example.com'），不能为空！
// 为空时"发行"/build 模式在启动时即无法使用（请求没有目标地址），必须在部署前填入。
// 部署前置要求：
//   1. 禁止使用 http 明文地址——JWT 令牌随每个请求明文传输，HTTP 下可被窃听；
//   2. 小程序端还需在微信后台把该域名配置为 request/socket 合法域名；
//   3. 生产构建前务必确认本常量已填写，resolveBaseUrl 会在启动时做兜底告警。
const PROD_BASE_URL = '';

// 真机调试专用：手机连不到 127.0.0.1 时，填电脑的局域网 IP（如 'http://192.168.1.100:5000'），
// 留空则开发环境继续使用 DEV_BASE_URL
const DEV_LAN_BASE_URL = '';

/**
 * 解析当前环境的后端地址
 * uni-app 在编译期会静态替换 process.env.NODE_ENV（运行=development，发行=production），
 * 该判断在 H5 / 小程序 / App 三端均生效
 */
function resolveBaseUrl() {
  // 真机调试：填了局域网地址且处于开发模式时优先使用
  if (DEV_LAN_BASE_URL && process.env.NODE_ENV !== 'production') {
    return DEV_LAN_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    // 防呆：发行构建若忘了配置 PROD_BASE_URL，启动时直接失败——
    // 空地址会导致 H5 请求打到同源静态服务器、Socket.IO 静默重连风暴，
    // 与其运行期不可用，不如在构建/启动阶段显式报错提醒部署者填写
    if (!PROD_BASE_URL) {
      throw new Error('[config] PROD_BASE_URL 未配置：生产构建必须在 config/index.js 填入线上 HTTPS 地址');
    } else if (PROD_BASE_URL.startsWith('http://')) {
      // http 明文地址保留告警不 throw：开发真机调试可能临时使用 http
      console.error('[config] PROD_BASE_URL 使用了 http 明文地址：JWT 令牌将随请求明文传输，存在被窃听风险，必须改为 HTTPS 地址。');
    }
    return PROD_BASE_URL;
  }
  return DEV_BASE_URL;
}

// 后端 API 与 Socket.IO 服务地址
export const BASE_URL = resolveBaseUrl();
