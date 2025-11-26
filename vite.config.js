import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Mantenha o nome do seu repositório aqui
  base: '/PMCsoftware/', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Aqui listamos TODAS as páginas do seu site
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