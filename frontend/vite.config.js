import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy /api/* paths to SCF Function URLs in development
      // Each path maps to a specific SCF function
      '/api/auth/login': {
        target: 'https://1376958570-g2eggxq7a1.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/login/, ''),
      },
      '/api/auth/register': {
        target: 'https://1376958570-jvqk3pe7v7.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/register/, ''),
      },
      '/api/auth/google': {
        target: 'https://1376958570-8almir1mut.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/google/, ''),
      },
      '/api/auth/refresh': {
        target: 'https://1376958570-4lbonmouil.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/refresh/, ''),
      },
      '/api/auth/logout': {
        target: 'https://1376958570-58sw116dj1.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/logout/, ''),
      },
      '/api/game/save': {
        target: 'https://1376958570-225exy4jp5.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/game\/save/, ''),
      },
      '/api/game/load': {
        target: 'https://1376958570-imgv1hyfax.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/game\/load/, ''),
      },
      '/api/game/delete': {
        target: 'https://1376958570-ktxfkfu4sd.ap-hongkong.tencentscf.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/game\/delete/, ''),
      },
    },
  },
});
