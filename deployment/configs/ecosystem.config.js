/**
 * PM2 Ecosystem Configuration for BlindSpot System
 * This file configures how PM2 manages the application process
 */

module.exports = {
  apps: [
    {
      // Application configuration
      name: 'bss-production',
      script: './server/index.ts',
      interpreter: 'tsx',
      
      // Cluster mode configuration
      instances: process.env.CLUSTER_WORKERS || 2,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Process management
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Watch configuration (disabled in production)
      watch: false,
      ignore_watch: [
        'node_modules',
        'dist',
        '.git',
        'logs',
        'public/invoices',
        'uploads',
      ],
      
      // Logging configuration
      error_file: '/var/log/bss/pm2-error.log',
      out_file: '/var/log/bss/pm2-out.log',
      log_file: '/var/log/bss/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Health check endpoint
      health_check: {
        interval: 30,
        path: '/api/health',
      },
    },
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'bss-user',
      host: 'your-ecs-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/bss.git',
      path: '/home/bss-app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no',
    },
    
    staging: {
      user: 'bss-user',
      host: 'staging-ecs-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/bss.git',
      path: '/home/bss-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};