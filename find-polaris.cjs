const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('app/**/*.{js,jsx,ts,tsx}');
const components = new Set();
const usages = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const match = content.match(/import\s+{([^}]+)}\s+from\s+['"]@shopify\/polaris['"]/s);
  if (match) {
    const list = match[1].split(',').map(c => c.trim()).filter(c => c);
    list.forEach(c => {
      components.add(c);
      if (!usages[c]) usages[c] = [];
      usages[c].push(f);
    });
  }
});

console.log(JSON.stringify(usages, null, 2));
