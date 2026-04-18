import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages は https://ユーザー名.github.io/リポジトリ名/ で配信されるため、
  // リポジトリ名をそのまま base に設定する必要があります。
  // リポジトリ名が "GenshinTCG" 以外の場合はここを変更してください。
  base: '/GITCG-deck/',
})