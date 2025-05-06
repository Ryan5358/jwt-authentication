import { config } from 'dotenv'
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory
const __dirname = dirname(__filename);

config({ path: path.resolve(__dirname, ".env") })