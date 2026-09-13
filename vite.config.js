import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * 自定义 vite 配置。
 * HBuilderX 工程没有 src 目录，`@` 需要显式映射到项目根目录，
 * 这样 CLI（npm run dev:h5 / build:h5）与 HBuilderX 两种编译方式行为一致；
 * 注意：不要在此处引入 uni() 插件——HBuilderX 与 uni CLI 都会自动注入。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir)
    },
    // uni-app 工程省略 .vue 扩展名导入（如 main.js 的 './App'），需在默认基础上补上
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  }
})
