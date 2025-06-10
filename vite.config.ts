import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // 🔧 CORRECTION CRITIQUE : Exposer les variables d'environnement au client
    // Utiliser process.env côté serveur pour récupérer les vraies valeurs
    'import.meta.env.VITE_DISCORD_CLIENT_ID': JSON.stringify(process.env.VITE_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID || ''),
  },
});