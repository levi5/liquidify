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

  it('compiles .slice(0, variable) without chaining minus onto the sliced array', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function List({ items, limit }) {
  const visible = items.slice(0, limit)
  return <ul>{visible.map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/List.tsx',
    )
    assert.match(component.html, /{% assign visible = items \| slice: 0, limit %}/)
    assert.doesNotMatch(component.html, /\| minus:/)
  })

  it('compiles .slice(dynamicStart, dynamicEnd) with a temp length assign', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function List({ items, start, end }) {
  const visible = items.slice(start, end)
  return <ul>{visible.map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/List.tsx',
    )
    assert.match(component.html, /{% assign __liquidify_slice_\d+ = end \| minus: start %}/)
    assert.match(component.html, /{% assign visible = items \| slice: start, __liquidify_slice_\d+ %}/)
  })

  it('keeps chained string concatenation as append instead of plus', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Label({ first, last }) {
  const label = first + " " + last
  return <p>{label}</p>
}`,
      '/theme/src/components/snippets/Label.tsx',
    )
    assert.match(component.html, /{% assign label = first \| append: " " \| append: last %}/)
  })

  it('keeps numeric addition as plus', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Total({ price, tax }) {
  const total = price + tax
  const count = price + 1
  return <p>{total} {count}</p>
}`,
      '/theme/src/components/snippets/Total.tsx',
    )
    assert.match(component.html, /{% assign total = price \| plus: tax %}/)
    assert.match(component.html, /{% assign count = price \| plus: 1 %}/)
  })

  it('guards || fallbacks against nil, empty, false and zero', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Cols({ settings }) {
  const columns = settings.columns || 4
  return <p>{columns}</p>
}`,
      '/theme/src/components/snippets/Cols.tsx',
    )
    assert.match(component.html, /{% assign columns = settings\.columns %}/)
    assert.match(component.html, /{% if columns == nil or columns == "" or columns == false or columns == 0 %}/)
    assert.doesNotMatch(component.html, /\| default:/)
  })

  it('negates numeric flags with explicit nil, false, zero and empty checks', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Count({ count }) {
  return <div>{!count ? 'empty' : 'full'}</div>
}`,
      '/theme/src/components/snippets/Count.tsx',
    )
    assert.match(component.html, /count == nil or count == false or count == 0 or count == ""/)
    assert.doesNotMatch(component.html, /== blank/)
  })

  it('normalizes bare identifier conditions in && branches', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Badge({ count }) {
  return <div>{count && <span>items</span>}</div>
}`,
      '/theme/src/components/snippets/Badge.tsx',
    )
    assert.match(component.html, /{% if count != nil and count != false and count != 0 and count != "" %}/)
  })

  it('omits attributes whose && guard is falsy', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Pic({ hasAlt, title }) {
  return <img alt={hasAlt && title} />
}`,
      '/theme/src/components/snippets/Pic.tsx',
    )
    assert.match(component.html, /{% if hasAlt == nil or hasAlt == "" or hasAlt == false or hasAlt == 0 %}{% else %}/)
    assert.doesNotMatch(component.html, /<img alt="{{ title/)
  })

  it('hoists piped translate params instead of leaking the pipe', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { t } from 'liquidify'
export default function Label({ count }) {
  const label = t('products.count', count || 1)
  return <p>{label}</p>
}`,
      '/theme/src/components/snippets/LabelT.tsx',
    )
    const hoisted = component.html.match(/{% assign (__liquidify_\w+_\d+) = count %}/)[1]
    assert.match(component.html, new RegExp(`{% if ${hoisted} == nil or ${hoisted} == "" or ${hoisted} == false or ${hoisted} == 0 %}`))
    assert.match(component.html, new RegExp(`{% assign ${hoisted} = 1 %}`))
    assert.match(component.html, new RegExp(`\\| t: ${hoisted}`))
  })

  it('hoists piped join separator', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Tags({ tags, sep }) {
  const line = tags.join(sep || ", ")
  return <p>{line}</p>
}`,
      '/theme/src/components/snippets/Tags.tsx',
    )
    const hoisted = component.html.match(/{% assign (__liquidify_\w+_\d+) = sep %}/)[1]
    assert.match(component.html, new RegExp(`{% if ${hoisted} == nil or ${hoisted} == "" or ${hoisted} == false or ${hoisted} == 0 %}`))
    assert.match(component.html, new RegExp(`{% assign ${hoisted} = ", " %}`))
    assert.match(component.html, new RegExp(`\\| join: ${hoisted}`))
  })

  it('hoists dynamic for-loop limit for sliced ranges', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Slice({ items, start, end }) {
  return <ul>{items.slice(start, end).map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/Slice.tsx',
    )
    assert.match(component.html, /{% assign __liquidify_limit_\d+ = end \| minus: start %}/)
    assert.match(component.html, /{% for item in items limit: __liquidify_limit_\d+ offset: start %}/)
  })

  it('hoists piped where values instead of leaking the pipe', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Filtered({ items, fallback }) {
  const list = items.filter((p) => p.type == (fallback || "x"))
  return <ul>{list.map((item) => <li>{item.title}</li>)}</ul>
}`,
      '/theme/src/components/snippets/Filtered.tsx',
    )
    const hoisted = component.html.match(/{% assign (__liquidify_\w+_\d+) = fallback %}/)[1]
    assert.match(component.html, new RegExp(`{% if ${hoisted} == nil or ${hoisted} == "" or ${hoisted} == false or ${hoisted} == 0 %}`))
    assert.match(component.html, new RegExp(`{% assign ${hoisted} = "x" %}`))
    assert.match(component.html, new RegExp(`\\| where: "type", ${hoisted}`))
  })

  it('keeps char-local filters inline in template literals', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { escape } from 'liquidify'
export default function Esc({ a, b }) {
  const label = \`\${a}\${escape(b)}\`
  return <p>{label}</p>
}`,
      '/theme/src/components/snippets/Esc.tsx',
    )
    assert.doesNotMatch(component.html, /__liquidify_template_\d+/)
    assert.match(component.html, /\| append: b \| escape/)
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
      path.resolve(import.meta.dirname, '../resources/templates/theme/src/app/sections/Home/Hero/index.tsx'),
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

  it('hoists attribute fallbacks and browser location outside the tag', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function ActiveFilters({ collection }) {
  return (
    <div className="active-filters">
      <a className="text-link" href={window.location.pathname + '?sort_by=' + (collection.sort_by || collection.default_sort_by)}>
        Clear all
      </a>
    </div>
  )
}`,
      '/theme/src/components/snippets/ActiveFilters.tsx',
    )

    assert.ok(component.html.includes('request.path'), component.html)
    assert.match(component.html, /{% assign __liquidify_logic_0 = collection\.sort_by %}/)
    assert.doesNotMatch(component.html, /__liquidify_logic_1/)
    assert.match(
      component.html,
      /{% assign __liquidify_attribute_\d+ = request\.path \| append: "\?sort_by=" \| append: __liquidify_logic_0 %}/,
    )

    const tag = component.html.match(/<a\b[^>]*>/)?.[0] ?? ''
    assert.ok(tag.includes('href="{{ __liquidify_attribute_'), tag)
    assert.doesNotMatch(tag, /{%/)

    for (const [, output] of component.html.matchAll(/{{(.*?)}}/g)) {
      assert.doesNotMatch(output, /\bor\b/, `bare "or" leaked into output: {{${output}}}`)
    }
  })

  it('hoists snippet prop fallbacks before the render tag', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use sections'
import { RenderSnippet } from 'liquidex'
const Child = () => null
export const Section = () => <RenderSnippet slot={Child} heading={section.settings.heading || 'Fallback'} />`,
      '/theme/src/app/sections/Section/index.tsx',
    )

    assert.match(component.html, /{% assign __liquidify_logic_0 = section\.settings\.heading %}\n/)
    assert.match(component.html, /{% render 'child', heading: __liquidify_logic_0 %}/)
  })

  it('renders an early return as the empty branch of a condition', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Empty({ items }) {
  if (items.length === 0) return null
  return <div>{items.length}</div>
}`,
      '/theme/src/components/snippets/Empty.tsx',
    )

    assert.match(component.html, /{% if items\.size == 0 %}{% else %}<div>{{ items\.size \| escape }}<\/div>{% endif %}/)
    assert.doesNotMatch(component.html, /nil \| escape/)
  })
})
