// ecosystem.config.js

// PM2 configuration for both backend (NestJS) and frontend (Next.js).
// Run from the repo root on the VPS after `pnpm build`.
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup

module.exports = {
  apps: [
    // ---------- Backend (NestJS API) ----------
    {
      name: 'inventory-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1, // single user system — no need for clustering
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Log rotation is handled by pm2-logrotate (see DEPLOYMENT.md)
      out_file: '../../logs/api-out.log',
      error_file: '../../logs/api-err.log',
      merge_logs: true,
      time: true,
    },

    // ---------- Frontend (Next.js) ----------
    {
      name: 'inventory-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '../../logs/web-out.log',
      error_file: '../../logs/web-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
