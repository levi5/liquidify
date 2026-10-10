const { preprocessLiquidDelimiters } = require('./dist/infra/adapters/parsers/babel/ASTParser.js');
const { parse } = require('@babel/parser');

const src = "'use snippets'\nexport default function S() { return ({\"{% capture t %}\"}x{\"{% endcapture %}\"}{\"{{ t }}\"}) }";

console.log('Preprocessed source:');
console.log(preprocessLiquidDelimiters(src));

const delimited = preprocessLiquidDelimiters(src);
console.log('\nTrying to parse...');
try {
  const ast = parse(delimited, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  console.log('Parse OK!');
} catch (e) {
  console.log('Parse error:', e.message);
  if (e.loc) console.log('Location:', e.loc);
}