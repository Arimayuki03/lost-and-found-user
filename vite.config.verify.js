// 仅供 CLI/CI 编译验证使用（HBuilderX 用户请忽略此文件，正常使用 vite.config.js）
// 用法：UNI_INPUT_DIR=<项目根> UNI_OUTPUT_DIR=dist/build/h5 UNI_PLATFORM=h5 npx vite build --config vite.config.verify.js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir)
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  plugins: [uni()]
})
