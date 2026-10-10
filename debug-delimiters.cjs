// Test the actual compiled functions
const { preprocessLiquidDelimiters } = require('./dist/infra/adapters/parsers/babel/ASTParser.js');

// Test case 1: simple {{ }} in JSX text position
const src1 = "return (\n  <p>{{ x }}</p>\n)";
console.log('Test 1 - simple {{ x }}:');
console.log('IN:', JSON.stringify(src1));
console.log('OUT:', JSON.stringify(preprocessLiquidDelimiters(src1)));
console.log();

// Test case 2: {{ with filter
const src2 = "return <p>{{ x | default: 1 }}</p>";
console.log('Test 2 - {{ with filter:');
console.log('IN:', JSON.stringify(src2));
console.log('OUT:', JSON.stringify(preprocessLiquidDelimiters(src2)));
console.log();

// Test case 3: {% tag %}
const src3 = "return <p>{% assign y = x %}hi</p>";
console.log('Test 3 - {% assign %}:');
console.log('IN:', JSON.stringify(src3));
console.log('OUT:', JSON.stringify(preprocessLiquidDelimiters(src3)));
console.log();

// Test case 4: nested {{ after }}
const src4 = "return ({% capture t %}x{% endcapture %}{{ t }})";
console.log('Test 4 - nested:');
console.log('IN:', JSON.stringify(src4));
console.log('OUT:', JSON.stringify(preprocessLiquidDelimiters(src4)));
console.log();

// Test case 5: with proper JSX
const src5 = "'use snippets'\nexport default function Sample(props) { return ( <p>{{ x }}</p> ) }\n";
console.log('Test 5 - full component:');
console.log('IN:', JSON.stringify(src5));
console.log('OUT:', JSON.stringify(preprocessLiquidDelimiters(src5)));