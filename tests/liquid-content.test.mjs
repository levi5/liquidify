import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatHtml, buildLiquidContent } from '../dist/infra/adapters/generators/liquid/liquid-content.js'

test('formatHtml keeps greater-than signs inside quoted attributes', () => {
  assert.equal(formatHtml('<div data-rule="a > b"><span>ok</span></div>'), '<div data-rule="a > b">\n  <span>\n    ok\n  </span>\n</div>')
})

test('formatHtml keeps void elements from changing indentation', () => {
  assert.equal(formatHtml('<div><img src="x"><span>ok</span></div>'), '<div>\n  <img src="x">\n  <span>\n    ok\n  </span>\n</div>')
})

test('formatHtml does not treat comparisons inside Liquid tags as HTML', () => {
  assert.equal(formatHtml('<p>{% if count < max %}Ready{% endif %}</p>'), '<p>\n  {% if count < max %}Ready{% endif %}\n</p>')
})

test('buildLiquidContent preserves scripts, schema and stylesheet', () => {
  const component = {
    name: 'Card', html: '<p>Card</p>', script: 'console.log(1)', liquidAssignments: [],
    type: 'sections', hasScript: true, schema: { name: 'Card' }, blocksSchema: [], css: '.card { color: red; }',
  }
  const output = buildLiquidContent(component, 'card')
  assert.match(output, /card\.js' \| asset_url/)
  assert.match(output, /\{% schema %\}/)
  assert.match(output, /"name": "Card"/)
  assert.match(output, /\{% stylesheet %\}/)
})
