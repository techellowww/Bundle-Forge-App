const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('app');
const fileUsages = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@shopify\/polaris['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(s => s.trim()).filter(Boolean);
    imports.forEach(i => {
      // Remove aliases like "Modal as PolarisModal"
      const compName = i.split(' as ')[0].trim();
      if (!fileUsages[compName]) fileUsages[compName] = [];
      fileUsages[compName].push(f);
    });
  }
});

console.log(JSON.stringify(fileUsages, null, 2));
