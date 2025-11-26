import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Correção necessária para __dirname funcionar em projetos "type": "module"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  // Mantenha o nome do repositório correto
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