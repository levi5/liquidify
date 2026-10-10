const { parse } = require('@babel/parser');

const testCases = [
  'export default function S() { return ({"{% capture t %}"}) }',
  'export default function S() { return ({"test"}) }',
  'export default function S() { return ({"a%}b"}) }',
  'export default function S() { return ({"{% capture t %}"}x) }',
];

for (const src of testCases) {
  console.log('\nTesting:', src);
  try {
    const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    console.log('  OK');
  } catch (e) {
    console.log('  ERROR:', e.message);
  }
}