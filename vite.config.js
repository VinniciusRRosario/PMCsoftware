import { defineConfig } from 'vite'

export default defineConfig({
  // IMPORTANTE: Troque 'NOME-DO-SEU-REPOSITORIO' pelo nome exato
  // que você vai dar ao repositório no GitHub (ex: 'pmcsoftware')
  base: '/PMCsoftware/', 
  build: {
    outDir: 'dist',
  }
})