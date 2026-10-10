const { preprocessLiquidDelimiters } = require('./dist/infra/adapters/parsers/babel/ASTParser.js');

// Test with debug
const src = "return <p>{{ x | default: 1 }}</p>";
console.log('Testing:', JSON.stringify(src));
console.log('Result:', JSON.stringify(preprocessLiquidDelimiters(src)));