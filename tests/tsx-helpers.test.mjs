import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { makeParser } from './helpers.mjs'

describe('TSX-first helpers (no Liquid-in-strings)', () => {
  it('raw() outputs without escape', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { raw } from 'liquidify'
export default function Article() {
  return <div>{raw(article.content)}</div>
}`,
      '/theme/src/components/snippets/Article.tsx',
    )
    assert.ok(component.html.includes('{{ article.content }}'))
    assert.ok(!component.html.includes('| escape'))
  })

  it('<Raw html={...} /> outputs without escape', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { Raw } from 'liquidify'
export default function Article() {
  return <Raw html={article.content} />
}`,
      '/theme/src/components/snippets/ArticleRaw.tsx',
    )
    assert.ok(component.html.includes('{{ article.content }}'))
  })

  it('t() maps to | t filter', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { t } from 'liquidify'
export default function Search() {
  return <p>{t('search.placeholder')}</p>
}`,
      '/theme/src/components/snippets/SearchT.tsx',
    )
    assert.ok(component.html.includes('| t'))
  })

  it('t() with params object maps to named args', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { t } from 'liquidify'
export default function Count() {
  return <span>{t('collection.products_count', { count: collection.products_count })}</span>
}`,
      '/theme/src/components/snippets/CountT.tsx',
    )
    assert.ok(component.html.includes('| t:'))
    assert.ok(component.html.includes('count:'))
  })

  it('imageUrl() with number maps to width', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { imageUrl } from 'liquidify'
export default function Card() {
  return <img src={imageUrl(product.featured_image, 700)} />
}`,
      '/theme/src/components/snippets/CardImg.tsx',
    )
    assert.ok(component.html.includes('image_url: width: 700'))
  })

  it('imageUrl() with options object maps pairs', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { imageUrl } from 'liquidify'
export default function Card() {
  return <img src={imageUrl(product.featured_image, { width: 700, height: 880 })} />
}`,
      '/theme/src/components/snippets/CardImgOpts.tsx',
    )
    assert.ok(component.html.includes('image_url:'))
    assert.ok(component.html.includes('width: 700'))
    assert.ok(component.html.includes('height: 880'))
  })

  it('TSX ternary in attribute compiles to {% if %} (no liquid string)', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
export default function Rec() {
  return <div data-recommendations-state={recommendations.performed && recommendations.products_count > 0 ? 'loaded' : 'fallback'} />
}`,
      '/theme/src/components/snippets/RecState.tsx',
    )
    assert.ok(!component.html.includes('&&'))
    assert.ok(component.html.includes('{% if recommendations.performed %}'))
    assert.ok(component.html.includes('{% if recommendations.products_count > 0 %}loaded'))
  })

  it('json() outputs | json without escape', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import { json } from 'liquidify'
export default function Data() {
  return <script type="application/json">{json(product)}</script>
}`,
      '/theme/src/components/snippets/DataJson.tsx',
    )
    assert.ok(component.html.includes('| json'))
  })
})
