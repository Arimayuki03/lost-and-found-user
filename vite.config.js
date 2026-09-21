import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * 自定义 vite 配置（CLI 构建用，HBuilderX 用户可忽略本文件）。
 * HBuilderX 工程没有 src 目录，`@` 需要显式映射到项目根目录，
 * 这样 CLI（npm run dev:h5 / build:h5）与 HBuilderX 两种编译方式行为一致。
 * uni() 插件必须在此显式引入：HBuilderX 根目录结构（无 src/）下，
 * uni CLI 的自动注入对本配置文件不生效，缺失会导致 .vue 文件无法编译。
 */
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir)
    },
    // uni-app 工程省略 .vue 扩展名导入（如 main.js 的 './App'），需在默认基础上补上
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  // 开发服务器：固定端口便于文档与真机调试（host 放开才能让手机通过局域网 IP 访问）。
  // 仅对 CLI H5（npm run dev:h5）生效；微信小程序 / App 端不经 HTTP 端口，HBuilderX 运行用其内置服务器。
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
