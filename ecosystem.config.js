module.exports = {
  apps: [
    {
      name: 'mande-ia',
      cwd: '/www/wwwroot/mande-ia-v2',
      script: 'server.js',
      uid: 'www',
      gid: 'www',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '350M',
      restart_delay: 3000,
      kill_timeout: 5000,
      time: true,
      env: { NODE_ENV: 'production' }
    }
  ]
};
