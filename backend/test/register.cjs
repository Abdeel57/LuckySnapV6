// Carga TypeScript en las pruebas (node --test) sin compilar a dist/.
const path = require('path');
require('ts-node').register({
  transpileOnly: true,
  project: path.join(__dirname, '..', 'tsconfig.json'),
});
