/**
 * Fix remaining Redis null issues in specific files
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const fixes = [
  {
    file: 'websocket/index.ts',
    replacements: [
      { from: 'redis.ltrim(', to: 'redis?.ltrim(' }
    ]
  },
  {
    file: 'services/websocket.service.ts',
    replacements: [
      { from: 'redis.ping()', to: 'redis?.ping()' }
    ]
  },
  {
    file: 'services/vote.service.ts',
    replacements: [
      { from: 'redis.ltrim(', to: 'redis?.ltrim(' }
    ]
  },
  {
    file: 'services/dashboard.service.ts',
    replacements: [
      { from: 'redis.ping()', to: 'redis?.ping()' }
    ]
  },
  {
    file: 'services/auth.service.ts',
    replacements: [
      { from: 'redis.ltrim(', to: 'redis?.ltrim(' }
    ]
  },
  {
    file: 'services/admin.service.ts',
    replacements: [
      { from: 'redis.ping()', to: 'redis?.ping()' }
    ]
  },
  {
    file: 'app.ts',
    replacements: [
      { from: 'redis.ping()', to: 'redis?.ping()' },
      { from: 'redis.disconnect()', to: 'redis?.disconnect()' }
    ]
  },
  {
    file: 'server.ts',
    replacements: [
      { from: 'redis.status', to: 'redis?.status' },
      { from: 'redis.once(', to: 'redis?.once(' },
      { from: 'redis.connect()', to: 'redis?.connect()' },
      { from: 'redis.ping()', to: 'redis?.ping()' },
      { from: 'redis.disconnect()', to: 'redis?.disconnect()' }
    ]
  }
];

console.log('🔧 Fixing remaining Redis null issues...\n');

for (const fix of fixes) {
  const filePath = path.join(srcDir, fix.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const r of fix.replacements) {
    // Only replace if not already optional chaining
    const regex = new RegExp(r.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, r.to);
  }

  // Fix double optional chaining
  content = content.replace(/\?\.\?/g, '?.');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${fix.file}`);
  } else {
    console.log(`⏭️  No changes: ${fix.file}`);
  }
}

// Also need to fix config/redis.ts internal methods
const redisConfigPath = path.join(srcDir, 'config/redis.ts');
let redisContent = fs.readFileSync(redisConfigPath, 'utf8');
const originalRedis = redisContent;

// Inside the class methods, redis is called from getInstance() which can return null
// These need to check for null first
const internalFixes = [
  // These are inside methods that already check REDIS_ENABLED, but redis could still be null
  { from: 'const value = await redis.get(key)', to: 'const value = await redis?.get(key)' },
  { from: 'const keys = await redis.keys(pattern)', to: 'const keys = await redis?.keys(pattern)' },
  { from: 'if (keys.length > 0) await redis.del(...keys)', to: 'if (keys && keys.length > 0) await redis?.del(...keys)' },
  { from: 'const session = await redis.get(`session:${sessionId}`)', to: 'const session = await redis?.get(`session:${sessionId}`)' },
  { from: 'const result = await redis.get(`blacklist:${token}`)', to: 'const result = await redis?.get(`blacklist:${token}`)' },
  { from: 'const multi = redis.multi()', to: 'const multi = redis?.multi()' },
  { from: 'const result = await redis.set(', to: 'const result = await redis?.set(' },
  { from: 'const data = await redis.rpop(', to: 'const data = await redis?.rpop(' },
];

for (const fix of internalFixes) {
  redisContent = redisContent.replace(fix.from, fix.to);
}

if (redisContent !== originalRedis) {
  fs.writeFileSync(redisConfigPath, redisContent, 'utf8');
  console.log('✅ Fixed: config/redis.ts');
}

console.log('\nDone! 🎉');
