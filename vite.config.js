import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ⚠️ リポジトリ名が GenshinTCG 以外の場合はここを変更してください
  base: '/GenshinTCG/',
})
