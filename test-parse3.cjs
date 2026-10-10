const { parse } = require('@babel/parser');

const src = 'export default function S() { return ({"test"}) }';

console.log('With jsx plugin:');
try {
  const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  console.log('  With jsx: OK');
} catch (e) {
  console.log('  With jsx ERROR:', e.message);
}

console.log('\nWithout jsx plugin:');
try {
  const ast = parse(src, { sourceType: 'module', plugins: ['typescript'] });
  console.log('  Without jsx: OK');
} catch (e) {
  console.log('  Without jsx ERROR:', e.message);
}