// Debug script to run the server with more verbose logging
process.env.DEBUG = 'express:*,passport:*';

// Use child_process to run the server with debug output
import { spawn } from 'child_process';

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, DEBUG: 'express:*,passport:*' }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill();
  process.exit(0);
});
