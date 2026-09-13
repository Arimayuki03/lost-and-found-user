/**
 * 全局配置（唯一后端地址配置点）
 * 全项目通过 `import { BASE_URL } from '@/config'` 引用，部署时只需修改本文件的地址常量。
 */

// 开发环境：本机后端（HBuilderX "运行" 模式使用）
const DEV_BASE_URL = 'http://127.0.0.1:5000';

// 生产环境：上线前必须改成实际的服务器地址！
// （"发行"/build 模式使用；小程序端还需在微信后台把该域名配置为合法域名）
const PROD_BASE_URL = 'http://127.0.0.1:5000'; // TODO: 部署前改为线上地址，例如 https://api.example.com

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
  return process.env.NODE_ENV === 'production' ? PROD_BASE_URL : DEV_BASE_URL;
}

// 后端 API 与 Socket.IO 服务地址
export const BASE_URL = resolveBaseUrl();
