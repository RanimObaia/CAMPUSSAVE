import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Bibliothèques rarement modifiées dans des fichiers à part : le navigateur les garde en cache
        // entre deux mises à jour du site, et le fichier principal reste léger.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@?firebase|@firebase)[\\/]/, priority: 20 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
