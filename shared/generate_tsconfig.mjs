import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Helper to convert __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the shared path aliases
const sharedAliasesPath = path.resolve(__dirname, 'commonAliases.json');
const sharedAliases = JSON.parse(await fs.readFile(sharedAliasesPath, 'utf8'));

// Load your existing tsconfig.json
const tsconfigPath = path.resolve('tsconfig.base.json');
const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'));

// Load your existing tsconfig.json in shared
const tsconfigSharedPath = path.resolve(__dirname, 'tsconfig.base.json');
const tsconfigShared = JSON.parse(await fs.readFile(tsconfigSharedPath, 'utf8'));

// Function to strip all whitespace of substring surrounded by [] but keep the whitespace after the comma separating the elements
const stripWhitespaceInArrays = (jsonString) => {
  return jsonString.replace(/\[\s*([^\]]+?)\s*\]/g, (_, p1) => {
    return `[${p1.replace(/\s*,\s*/g, ', ')}]`;
  });
};

// Function to handle the generation of tsconfig files
const generateTsconfig = async (pathPrefix, tsconfig) => {
  // Merge shared aliases into tsconfig's paths
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};
  tsconfig.compilerOptions.paths = {
    ...(tsconfig.compilerOptions.paths || {}),
    ...sharedAliases
  };

  // Path for the generated tsconfig file
  const generatedTsconfigPath = path.resolve(pathPrefix, 'tsconfig.json');

  // Convert the updated config to a JSON string with the custom stringify
  const newConfigContent = stripWhitespaceInArrays(JSON.stringify(tsconfig, null, 2));

  try {
    // Check if the generated file already exists
    const existingContent = await fs.readFile(generatedTsconfigPath, 'utf8').catch(() => null);

    if (existingContent) {
      // Calculate hashes to compare existing and new content
      const newContentHash = crypto.createHash('md5').update(newConfigContent).digest('hex');
      const existingContentHash = crypto.createHash('md5').update(existingContent).digest('hex');

      // If the content has not changed, skip generation
      if (newContentHash === existingContentHash) {
        console.log(`> [SKIPPED] ${generatedTsconfigPath}`);
        return; // Skip the write operation and move to next iteration
      }
    }

    // Write the new config content to the file
    await fs.writeFile(generatedTsconfigPath, newConfigContent);
    console.log(`> [GENERATED] ${generatedTsconfigPath}`);
  } catch (error) {
    console.error(`> [ERROR] ${generatedTsconfigPath}`, error);
  }
};
// Call the generateTsconfig function for both configurations
await Promise.all([
  generateTsconfig('', tsconfig),
  generateTsconfig(__dirname, tsconfigShared),
]);

console.log()