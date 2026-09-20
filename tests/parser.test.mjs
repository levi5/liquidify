import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { makeParser } from './helpers.mjs'

describe('BabelLiquidParser golden outputs', () => {
  it('compiles a snippet: className -> class, props -> liquid output', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function SectionHeader({ heading }) {
  return <h1 className="section-title">{heading}</h1>
}`,
      '/theme/src/components/snippets/SectionHeader.tsx',
    )

    assert.equal(component.name, 'SectionHeader')
    assert.equal(component.mode, 'liquid')
    assert.equal(component.type, 'snippets')
    assert.equal(component.html, '<h1 class="section-title">{{ heading | escape }}</h1>')
  })

  it('compiles a liquid section with assignments from const declarations', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `export default function Hero() {
  const title = "{{ product.title }}"
  return <div className="hero"><h2>{title}</h2></div>
}`,
      '/theme/src/components/sections/Hero.tsx',
    )

    assert.equal(component.name, 'Hero')
    assert.equal(component.html.trim(), '{% assign title = "{{ product.title }}" %}\n<div class="hero"><h2>{{ title | escape }}</h2></div>')
    assert.deepEqual(component.liquidAssignments, [])
  })

  it('extracts an inline schema object', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `export default function Hero() {
  return <div className="hero">hi</div>
}
export const schema = { name: "Hero", settings: [{ type: "text", id: "title", label: "Title" }] }`,
      '/theme/src/components/sections/Hero.tsx',
    )

    assert.deepEqual(component.schema, {
      name: 'Hero',
      settings: [{ type: 'text', id: 'title', label: 'Title' }],
    })
  })

  it('resolves a schema exported through a local identifier', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `export default function H() { return <div>hi</div> }
const base = { name: "H", tag: "section" }
export const schema = base`,
      '/theme/src/components/sections/H.tsx',
    )

    assert.deepEqual(component.schema, { name: 'H', tag: 'section' })
  })

  it('compiles .map() into a liquid for loop', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function List({ items }) {
  return <ul>{items.map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/List.tsx',
    )

    assert.equal(component.html, '<ul>{% for item in items %}<li>{{ item.title | escape }}</li>{% endfor %}</ul>')
  })

  it('detects dom mode and keeps plain html', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use dom'
export default function MobileMenu() {
  return <nav id="mobile-menu"><button>Menu</button></nav>
}`,
      '/theme/src/components/sections/MobileMenu.tsx',
    )

    assert.equal(component.mode, 'dom')
    assert.equal(component.html, '<nav id="mobile-menu"><button>Menu</button></nav>')
  })
})
