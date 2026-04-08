/**
 * Fix null results from optional chaining (keys, ttl, etc.)
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const filesToProcess = [];

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

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: keys?.length -> keys?.length ?? 0 or add null check
  // Pattern: if (keys.length > 0) -> if (keys && keys.length > 0)
  content = content.replace(
    /if\s*\(\s*keys\.length\s*>\s*0\s*\)/g,
    'if (keys && keys.length > 0)'
  );

  // Pattern: if (keys?.length > 0) -> if (keys && keys.length > 0)
  content = content.replace(
    /if\s*\(\s*keys\?\.length\s*>\s*0\s*\)/g,
    'if (keys && keys.length > 0)'
  );

  // Fix: cacheKeys.length -> cacheKeys?.length
  content = content.replace(
    /if\s*\(\s*cacheKeys\.length\s*>\s*0\s*\)/g,
    'if (cacheKeys && cacheKeys.length > 0)'
  );

  // Fix: results that could be undefined
  // await redis?.keys() returns string[] | undefined
  // Add ?? [] for array results
  content = content.replace(
    /const\s+keys\s*=\s*await\s+redis\?\.(keys)\(([^)]+)\)(?!\s*\?\?)/g,
    'const keys = await redis?.$1($2) ?? []'
  );

  content = content.replace(
    /const\s+cacheKeys\s*=\s*await\s+redis\?\.(smembers)\(([^)]+)\)(?!\s*\?\?)/g,
    'const cacheKeys = await redis?.$1($2) ?? []'
  );

  // Fix: info.split where info could be undefined
  content = content.replace(
    /info\.split\(/g,
    'info?.split('
  );

  content = content.replace(
    /keyspace\.split\(/g,
    'keyspace?.split('
  );

  // Fix: multi.incr, multi.expire where multi could be undefined
  content = content.replace(
    /multi\.incr\(/g,
    'multi?.incr('
  );

  content = content.replace(
    /multi\.expire\(/g,
    'multi?.expire('
  );

  content = content.replace(
    /multi\.exec\(/g,
    'multi?.exec('
  );

  // Fix: await pipeline.exec() where pipeline could be undefined
  content = content.replace(
    /await\s+pipeline\.exec\(\)/g,
    'await pipeline?.exec()'
  );

  // Fix: pipeline operations
  const pipelineMethods = ['zremrangebyscore', 'zadd', 'zcount', 'expire', 'incr', 'get', 'set', 'del'];
  for (const method of pipelineMethods) {
    content = content.replace(
      new RegExp(`pipeline\\.${method}\\(`, 'g'),
      `pipeline?.${method}(`
    );
  }

  // Fix double optional chaining
  content = content.replace(/\?\.\?/g, '?.');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Fixing null result issues...\n');

findTsFiles(srcDir);

let count = 0;
for (const file of filesToProcess) {
  if (processFile(file)) {
    console.log(`✅ Fixed: ${path.relative(srcDir, file)}`);
    count++;
  }
}

console.log(`\n✅ Fixed ${count} files`);
console.log('\nDone! 🎉');
