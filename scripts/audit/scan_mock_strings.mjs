import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.next' || file === 'mock' || file === 'mocks') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(full);
    }
  }
  return results;
}

const files = [...walk('frontend/app'), ...walk('frontend/components')];
const visibleMockStrings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('/*') &&
      !trimmed.includes('NEXT_PUBLIC_USE_MOCK') &&
      !trimmed.includes('isRealMode') &&
      !trimmed.includes('USE_MOCK')
    ) {
      if (/(?:["'`]|>)[^"'`<>]*(?:mock|Mock)[^"'`<>]*(?:["'`]|<)/.test(line)) {
        visibleMockStrings.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          text: trimmed,
        });
      }
    }
  });
}

console.log(JSON.stringify(visibleMockStrings, null, 2));
