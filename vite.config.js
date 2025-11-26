import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Se o seu repositório chama 'PMCsoftware', mantenha assim.
  // Se for outro nome, altere abaixo.
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