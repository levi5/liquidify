import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
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

  it('compiles .slice().map() into a liquid for loop with limit and offset', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function List({ items }) {
  return <ul>{items.slice(0, 8).map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/List.tsx',
    )
    assert.equal(component.html, '<ul>{% for item in items limit: 8 %}<li>{{ item.title | escape }}</li>{% endfor %}</ul>')
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

  it('compiles liquid filter expressions with default into correct liquid html (both quoted and unquoted)', async () => {
    const parser = makeParser()

    const unquoted = await parser.parse(
      `export default function Header() {
  return (
    <a className="wordmark" href={routes.root_url}>
      {settings.brand_name | default: shop.name | escape}
    </a>
  )
}`,
      '/theme/src/components/sections/Header.tsx',
    )
    assert.equal(
      unquoted.html.trim(),
      '<a class="wordmark" href="{{ routes.root_url | escape }}">{{ settings.brand_name | default: shop.name | escape }}</a>',
    )

    const quoted = await parser.parse(
      `export default function Header() {
  return (
    <a className="wordmark" href={routes.root_url}>
      {'settings.brand_name | default: shop.name | escape'}
    </a>
  )
}`,
      '/theme/src/components/sections/Header.tsx',
    )
    assert.equal(
      quoted.html.trim(),
      '<a class="wordmark" href="{{ routes.root_url | escape }}">{{ settings.brand_name | default: shop.name | escape }}</a>',
    )

    const backticks = await parser.parse(
      `export default function Header() {
  return (
    <a className="wordmark" href={routes.root_url}>
      {\`settings.brand_name | default: shop.name | escape\`}
    </a>
  )
}`,
      '/theme/src/components/sections/Header.tsx',
    )
    assert.equal(
      backticks.html.trim(),
      '<a class="wordmark" href="{{ routes.root_url | escape }}">{{ settings.brand_name | default: shop.name | escape }}</a>',
    )

    const inAttr = await parser.parse(
      `export default function Card() {
  return <img alt={settings.brand_name | default: shop.name | escape} />
}`,
      '/theme/src/components/snippets/Card.tsx',
    )
    assert.equal(inAttr.html.trim(), '<img alt="{{ settings.brand_name | default: shop.name | escape }}" />')
  })

  it('correctly compiles ternary expressions containing liquid filter strings without turning them into raw JS', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function ProductCard({ item }) {
  return (
    <span className="product-options-note">
      {item.variants.length === 1 ? '1 opção' : "item.variants.size | append: ' opções'"}
    </span>
  )
}`,
      '/theme/src/components/snippets/ProductCard.tsx',
    )
    assert.ok(!component.html.includes('item.variants.length === 1'))
    assert.ok(component.html.includes('{% if item.variants.size == 1 %}'))
    assert.ok(component.html.includes('1 opção'))
    assert.ok(component.html.includes("{{ item.variants.size | append: ' opções' }}"))
  })

  it('correctly resolves styles and classnames calls at compile-time', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use sections'
import styles from './styles.css'
import classNames from 'classnames'

export default function Hero() {
  return (
    <section className={classNames(styles['fashion-hero'], styles.container)}>
      <h1 className={classNames(styles.title)}>Title</h1>
      <button className={classNames(styles.button, { [styles['button-dark']]: true, [styles['button-outline']]: false })}>
        Button
      </button>
    </section>
  )
}`,
      path.resolve(import.meta.dirname, '../resources/templates/example/src/app/sections/Home/Hero/index.tsx'),
    )
    assert.ok(component.html.includes('<section class="fashion-hero container">'))
    assert.ok(component.html.includes('<h1 class="title">Title</h1>'))
    assert.ok(component.html.includes('<button class="button button-dark">Button</button>'))
  })

  it('emits snippet children as raw markup while still escaping text props', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Panel({ title }) {
  return (
    <div className="panel">
      <span>{title}</span>
      {children}
    </div>
  )
}`,
      '/theme/src/app/components/Panel.tsx',
    )

    assert.ok(component.html.includes('{{ children }}'), component.html)
    assert.ok(!component.html.includes('children | escape'), component.html)
    assert.ok(component.html.includes('{{ title | escape }}'), component.html)
  })
})
