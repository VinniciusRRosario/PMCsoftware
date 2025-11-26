import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Isso cria o __dirname manualmente para funcionar em projetos modernos
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  // Garanta que este nome seja IGUAL ao do seu repositório no GitHub
  base: '/PMCsoftware/', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        orders: resolve(__dirname, 'orders.html'),
        inventory: resolve(__dirname, 'inventory.html'),
        clients: resolve(__dirname, 'clients.html'),
        orderDetails: resolve(__dirname, 'order-details.html'),
      },
    },
  },
})