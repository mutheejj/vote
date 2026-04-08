/**
 * Script to update Redis null checks across all middleware and service files
 * Run with: node scripts/fix-redis-null-checks.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Files to process
const filesToProcess = [];

// Recursively find all .ts files
function findTsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsFiles(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      filesToProcess.push(filePath);
    }
  }
}

// Check if file imports redis
function importsRedis(content) {
  return content.includes("from '../config/redis'") ||
         content.includes("from '../../config/redis'") ||
         content.includes('from "../config/redis"') ||
         content.includes('from "../../config/redis"');
}

// Update import statement to include isDisabled
function updateImport(content) {
  // Pattern 1: import { redis } from '../config/redis'
  content = content.replace(
    /import\s*{\s*redis\s*}\s*from\s*['"]([^'"]+redis)['"]/g,
    "import { redis, isDisabled } from '$1'"
  );

  // Pattern 2: import { redis, otherStuff } from '../config/redis' (without isDisabled)
  content = content.replace(
    /import\s*{\s*([^}]*redis[^}]*)\s*}\s*from\s*['"]([^'"]+redis)['"]/g,
    (match, imports, path) => {
      if (imports.includes('isDisabled')) {
        return match; // Already has isDisabled
      }
      const importList = imports.split(',').map(s => s.trim());
      if (!importList.includes('isDisabled')) {
        importList.push('isDisabled');
      }
      return `import { ${importList.join(', ')} } from '${path}'`;
    }
  );

  return content;
}

// Add null checks before redis operations
function addNullChecks(content) {
  // Skip if already has null checks
  if (content.includes('if (isDisabled() || !redis)')) {
    return content;
  }

  // Pattern: await redis.someMethod(...)
  // We need to wrap these in null checks

  // For standalone redis calls like: await redis.get(key)
  content = content.replace(
    /(\s+)(const\s+\w+\s*=\s*)?await\s+redis\.(get|set|setex|del|keys|sadd|smembers|expire|info|pipeline|incr|zadd|zcount|zremrangebyscore|rpop|lpush|call)\(/g,
    (match, indent, constPart, method) => {
      // Don't add check if already wrapped
      if (content.substring(content.indexOf(match) - 50, content.indexOf(match)).includes('if (redis)')) {
        return match;
      }
      return `${indent}if (!redis) return null;\n${indent}${constPart || ''}await redis.${method}(`;
    }
  );

  return content;
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!importsRedis(content)) {
    return false;
  }

  const originalContent = content;

  // Update imports
  content = updateImport(content);

  // Note: We won't auto-add null checks as it's complex and error-prone
  // Instead, we'll just update imports and log files that need manual review

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main execution
console.log('🔍 Scanning for TypeScript files...\n');
findTsFiles(srcDir);

console.log(`Found ${filesToProcess.length} TypeScript files\n`);

const filesWithRedis = [];
const filesUpdated = [];

for (const file of filesToProcess) {
  const content = fs.readFileSync(file, 'utf8');
  if (importsRedis(content)) {
    filesWithRedis.push(file);
    const updated = processFile(file);
    if (updated) {
      filesUpdated.push(file);
    }
  }
}

console.log('📁 Files that import Redis:');
filesWithRedis.forEach(f => console.log(`  - ${path.relative(srcDir, f)}`));

console.log(`\n✅ Updated ${filesUpdated.length} files to include 'isDisabled' import`);
filesUpdated.forEach(f => console.log(`  - ${path.relative(srcDir, f)}`));

console.log('\n⚠️  MANUAL REVIEW REQUIRED:');
console.log('The following files use Redis and may need null checks added manually:');
filesWithRedis.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hasNullCheck = content.includes('isDisabled()') || content.includes('if (!redis)') || content.includes('if (redis)');
  if (!hasNullCheck) {
    console.log(`  ❌ ${path.relative(srcDir, f)} - NEEDS NULL CHECKS`);
  } else {
    console.log(`  ✓ ${path.relative(srcDir, f)} - Has null checks`);
  }
});

console.log('\n📝 Add this pattern to functions that use Redis:');
console.log(`
  // At the start of functions using Redis:
  if (isDisabled() || !redis) {
    return; // or return null/default value
  }
`);

console.log('\nDone! 🎉');
