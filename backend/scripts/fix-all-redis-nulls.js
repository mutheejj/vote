/**
 * Comprehensive script to fix ALL Redis null errors
 * Run with: node scripts/fix-all-redis-nulls.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
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

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if doesn't import redis
  if (!content.includes("from '../config/redis'") &&
      !content.includes("from '../../config/redis'") &&
      !content.includes('from "../config/redis"') &&
      !content.includes('from "../../config/redis"')) {
    return false;
  }

  const originalContent = content;

  // 1. Fix: await redis.method() -> await redis?.method()
  const methods = [
    'get', 'set', 'setex', 'del', 'keys', 'sadd', 'smembers',
    'expire', 'info', 'pipeline', 'incr', 'decr', 'zadd', 'zcount',
    'zremrangebyscore', 'rpop', 'lpush', 'rpush', 'call', 'multi',
    'publish', 'subscribe', 'unsubscribe', 'quit', 'hget', 'mget',
    'hset', 'hdel', 'hgetall', 'exists', 'ttl', 'scan', 'srem',
    'sismember', 'lpop', 'lrange', 'llen', 'zincrby', 'zrange'
  ];

  for (const method of methods) {
    // redis.method( -> redis?.method(
    content = content.replace(
      new RegExp(`(\\bredis)\\.(${method})\\(`, 'g'),
      '$1?.$2('
    );
    // redisSubscriber.method( -> redisSubscriber?.method(
    content = content.replace(
      new RegExp(`(\\bredisSubscriber)\\.(${method})\\(`, 'g'),
      '$1?.$2('
    );
    // redisPublisher.method( -> redisPublisher?.method(
    content = content.replace(
      new RegExp(`(\\bredisPublisher)\\.(${method})\\(`, 'g'),
      '$1?.$2('
    );
  }

  // 2. Fix pipeline/multi chains: redis.pipeline() or redis.multi()
  // These return objects that need chaining
  content = content.replace(
    /const\s+(\w+)\s*=\s*redis\?\.(pipeline|multi)\(\)/g,
    'const $1 = redis?.$2()'
  );

  // 3. Fix: redis?.pipeline().method -> redis?.pipeline()?.method
  content = content.replace(
    /redis\?\.(pipeline|multi)\(\)\.(\w+)/g,
    'redis?.$1()?.$2'
  );

  // 4. Fix double optional chaining
  content = content.replace(/\?\.\?/g, '?.');

  // 5. Fix: variable?.method()?.method() patterns for pipeline chains
  // pipeline.zremrangebyscore -> pipeline?.zremrangebyscore
  const pipelineVars = ['pipeline', 'multi', 'pipe'];
  for (const pVar of pipelineVars) {
    for (const method of methods) {
      content = content.replace(
        new RegExp(`(\\b${pVar})\\.(${method})\\(`, 'g'),
        '$1?.$2('
      );
    }
  }

  // 6. Add null coalescing for incr results: redis?.incr(key) ?? 0
  content = content.replace(
    /await\s+redis\?\.(incr|decr)\(([^)]+)\)(?!\s*\?\?)/g,
    'await redis?.$1($2) ?? 0'
  );

  // 7. Fix assignments where result could be undefined
  // const result = await redis?.get() should handle null
  // This is tricky - we'll add comments for manual review

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Fixing all Redis null errors...\n');

findTsFiles(srcDir);

let updatedCount = 0;
const updatedFiles = [];

for (const file of filesToProcess) {
  if (processFile(file)) {
    updatedCount++;
    updatedFiles.push(path.relative(srcDir, file));
  }
}

console.log(`✅ Updated ${updatedCount} files:\n`);
updatedFiles.forEach(f => console.log(`  - ${f}`));

console.log('\n🔍 Checking for remaining issues...\n');

// Second pass - find any remaining issues
let issuesFound = [];
for (const file of filesToProcess) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(srcDir, file);

  // Check for redis. without optional chaining (but not redis?.)
  const matches = content.match(/\bredis\.(?!\?)/g);
  if (matches && matches.length > 0) {
    issuesFound.push({ file: relativePath, count: matches.length, type: 'redis.' });
  }

  // Check for redisSubscriber. without optional chaining
  const subMatches = content.match(/\bredisSubscriber\.(?!\?)/g);
  if (subMatches && subMatches.length > 0) {
    issuesFound.push({ file: relativePath, count: subMatches.length, type: 'redisSubscriber.' });
  }

  // Check for redisPublisher. without optional chaining
  const pubMatches = content.match(/\bredisPublisher\.(?!\?)/g);
  if (pubMatches && pubMatches.length > 0) {
    issuesFound.push({ file: relativePath, count: pubMatches.length, type: 'redisPublisher.' });
  }
}

if (issuesFound.length > 0) {
  console.log('⚠️  Remaining issues to fix manually:\n');
  issuesFound.forEach(issue => {
    console.log(`  ${issue.file}: ${issue.count}x "${issue.type}" found`);
  });
} else {
  console.log('✅ No remaining redis null issues found!');
}

console.log('\nDone! 🎉');
