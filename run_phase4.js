const fs = require('fs');
const path = require('path');

const files = [
  'app/components/QuantityBreak/QuantityBreak.jsx',
  'app/components/BuyOneGetOne/BuyXGetY.jsx',
  'app/components/FixedBundles/FixedBundle.jsx',
  'app/components/Fbt/UpsellFbt.jsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  
  let code = fs.readFileSync(fullPath, 'utf8');

  // Remove CSS classes
  code = code.replace(/\.offer-form-row \{[\s\S]*?\}(?=\s*\.offer-form-row-3|\s*<\/style>)/, '');
  code = code.replace(/@media \(min-width: 768px\) \{\s*\.offer-form-row \{[\s\S]*?\}\s*\}/, '');
  code = code.replace(/\.offer-form-row-3 \{[\s\S]*?\}/, '');
  code = code.replace(/@media \(min-width: 768px\) \{\s*\.offer-form-row-3 \{[\s\S]*?\}\s*\}/, '');
  code = code.replace(/\.offer-form-row-4 \{[\s\S]*?\}/, '');
  code = code.replace(/@media \(min-width: 768px\) \{\s*\.offer-form-row-4 \{[\s\S]*?\}\s*\}/, '');
  code = code.replace(/\.v-stack \{[\s\S]*?\}/, '');

  code = code.replace(/<div className="v-stack" style=\{\{ gap:/g, '<div style={{ display: "flex", flexDirection: "column", gap:');
  
  // Replace opening and closing tags for offer-form-row
  // Status / Offer Title
  code = code.replace(/<div className="offer-form-row">\s*(<s-select[\s\S]*?label="Status"[\s\S]*?)<\/div>/, '<s-grid gridTemplateColumns="1fr 1fr" gap="400">\n                  $1</s-grid>');
  
  // Discount Title / Desc
  code = code.replace(/<div className="offer-form-row">\s*(<s-text-field[\s\S]*?label="Discount Title"[\s\S]*?)<\/div>/, '<s-grid gridTemplateColumns="1fr 1fr" gap="400">\n                  $1</s-grid>');

  // Start Date / End Date
  code = code.replace(/<div className="offer-form-row">\s*(<s-text-field[\s\S]*?label="Start Date"[\s\S]*?)<\/div>/, '<s-grid gridTemplateColumns="1fr 1fr" gap="400">\n                  $1</s-grid>');

  // Checkboxes
  code = code.replace(/<div className="offer-form-row-3">\s*(<s-checkbox label="Sub Title"[\s\S]*?)<\/div>/, '<s-grid gridTemplateColumns="1fr 1fr 1fr" gap="400">\n                            $1</s-grid>');

  // Checkbox inputs
  code = code.replace(/<div className="offer-form-row-3">\s*(\{tier\.subTitleEnabled \? \([\s\S]*?)<\/div>\s*<\/div>/, '<s-grid gridTemplateColumns="1fr 1fr 1fr" gap="400">\n                              $1</s-grid>\n                        </div>');

  // Tier grid
  code = code.replace(/<div className="offer-form-row-4" style=\{\{alignItems: "end"\}\}>\s*(<s-text-field[\s\S]*?label="Minimum Quantity"[\s\S]*?)<\/div>\s*(<div style=\{\{ display: "flex", flexDirection: "column")/g, '<s-grid gridTemplateColumns="1fr 1fr 1fr auto" gap="400" alignItems="end">\n                          $1</s-grid>\n\n                        $2');
  
  // Wait, the tier grid ends right before `<div className="v-stack" style={{ gap: "var(--p-space-400, 16px)" }}>`
  // Actually, wait, there's `)}` for the `fixedPrice` condition, then `</div>`.
  
  fs.writeFileSync(fullPath, code);
  console.log(`Updated ${file}`);
});
