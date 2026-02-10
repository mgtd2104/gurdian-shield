
import fs from 'fs';

console.log('Starting debug loader...');
import('./src/server.js')
  .then(() => console.log('Server loaded successfully'))
  .catch(err => {
    console.error('Failed to load server:', err);
    fs.writeFileSync('debug_error.log', `Import Error: ${err.message}\n${err.stack}\n`);
  });
