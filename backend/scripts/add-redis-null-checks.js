/**
 * Script to automatically add Redis null checks to all files
 * Run with: node scripts/add-redis-null-checks.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Files that need processing
const filesToFix = [
  'jobs/index.ts',
  'middleware/auth.middleware.ts',
  'middleware/security.middleware.ts',
  'scripts/clearEligibilityCache.ts',
  'services/admin.service.ts',
  'services/audit.service.ts',
  'services/auth.service.ts',
  'services/candidate.service.ts',
  'services/candidatePreRegistration.service.ts',
  'services/dashboard.service.ts',
  'services/election.service.ts',
  'services/notification.service.ts',
  'services/reporting.service.ts',
  'services/result.service.ts',
  'services/vote.service.ts',
  'services/voter.service.ts',
  'services/websocket.service.ts',
  'utils/userCache.ts',
  'websocket/index.ts'
];

function processFile(relativePath) {
  const filePath = path.join(srcDir, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace direct redis method calls with null-safe versions
  // Pattern: redis.methodName( -> redis?.methodName(
  const redisMethods = [
    'get', 'set', 'setex', 'del', 'keys', 'sadd', 'smembers',
    'expire', 'info', 'pipeline', 'incr', 'zadd', 'zcount',
    'zremrangebyscore', 'rpop', 'lpush', 'call', 'multi',
    'publish', 'subscribe', 'unsubscribe', 'quit', 'hget',
    'hset', 'hdel', 'hgetall', 'exists', 'ttl', 'scan'
  ];

  // Replace redis.method with redis?.method (optional chaining)
  for (const method of redisMethods) {
    // Match redis.method( but not redis?.method(
    const pattern = new RegExp(`redis\\.${method}\\(`, 'g');
    content = content.replace(pattern, `redis?.${method}(`);
  }

  // Also handle redisSubscriber and redisPublisher
  for (const method of redisMethods) {
    content = content.replace(
      new RegExp(`redisSubscriber\\.${method}\\(`, 'g'),
      `redisSubscriber?.${method}(`
    );
    content = content.replace(
      new RegExp(`redisPublisher\\.${method}\\(`, 'g'),
      `redisPublisher?.${method}(`
    );
  }

  // Fix double optional chaining (redis?.?.method -> redis?.method)
  content = content.replace(/redis\?\.\?/g, 'redis?.');
  content = content.replace(/redisSubscriber\?\.\?/g, 'redisSubscriber?.');
  content = content.replace(/redisPublisher\?\.\?/g, 'redisPublisher?.');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${relativePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed: ${relativePath}`);
    return false;
  }
}

console.log('🔧 Adding Redis null checks using optional chaining...\n');

let updatedCount = 0;
for (const file of filesToFix) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} files`);
console.log('\n📝 Note: Optional chaining (?.) will safely return undefined if redis is null');
console.log('   Example: redis?.get(key) returns undefined instead of throwing error');
console.log('\nDone! 🎉');
