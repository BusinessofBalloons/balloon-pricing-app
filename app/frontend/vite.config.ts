import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://balloon-backend-jyo1.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
