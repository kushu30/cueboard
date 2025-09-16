import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || './cueboard.db',
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'db/migrations'),
    },
  },
};