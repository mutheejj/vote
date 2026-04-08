/**
 * Fix specific null issues reported by TypeScript
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const specificFixes = [
  {
    file: 'jobs/index.ts',
    fixes: [
      // ttl possibly undefined - add default
      { from: /if\s*\(\s*ttl\s*<=\s*0\s*\)/g, to: 'if ((ttl ?? 0) <= 0)' },
      // Also fix ttl assignments
      { from: /const\s+ttl\s*=\s*await\s+redis\?\.ttl\(/g, to: 'const ttl = await redis?.ttl(' },
    ]
  },
  {
    file: 'services/auth.service.ts',
    fixes: [
      // sessions possibly undefined
      { from: /for\s*\(\s*const\s+sessionKey\s+of\s+sessions\s*\)/g, to: 'for (const sessionKey of sessions ?? [])' },
    ]
  },
  {
    file: 'services/dashboard.service.ts',
    fixes: [
      // info possibly undefined
      { from: /info\.match\(/g, to: 'info?.match(' },
    ]
  },
  {
    file: 'services/vote.service.ts',
    fixes: [
      // times possibly undefined
      { from: /if\s*\(\s*times\.length\s*===\s*0\s*\)/g, to: 'if (!times || times.length === 0)' },
      { from: /const\s+numericTimes\s*=\s*times\.map\(/g, to: 'const numericTimes = (times ?? []).map(' },
    ]
  },
  {
    file: 'websocket/index.ts',
    fixes: [
      // notifications possibly undefined
      { from: /for\s*\(\s*const\s+notification\s+of\s+notifications\s*\)/g, to: 'for (const notification of notifications ?? [])' },
      { from: /if\s*\(\s*notifications\.length\s*>\s*0\s*\)/g, to: 'if (notifications && notifications.length > 0)' },
    ]
  }
];

console.log('🔧 Fixing specific null issues...\n');

for (const item of specificFixes) {
  const filePath = path.join(srcDir, item.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${item.file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const fix of item.fixes) {
    content = content.replace(fix.from, fix.to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${item.file}`);
  } else {
    console.log(`⏭️  No changes: ${item.file}`);
  }
}

console.log('\nDone! 🎉');
