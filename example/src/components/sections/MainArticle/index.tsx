'use sections'

import styles from './styles.css'

export const MainArticle = () => {
  return (
    <article className="article-page container section-space">
      <div className="page-heading">
        <a className="eyebrow" href={blog.url}>
          {'blog.title | escape'}
        </a>
        <h1>{'article.title | escape'}</h1>
        <p className="muted">
          {'article.published_at | date: "%d.%m.%Y"'} · {'article.author | escape'}
        </p>
      </div>
      {'{% if article.image %}'}
      <img
        className="article-cover"
        src="{{ article.image | image_url: width: 1800 }}"
        alt="{{ article.image.alt | default: article.title | escape }}"
        width="1500"
        height="850"
      />
      {'{% endif %}'}
      <div className="rich-text page-content">{'{{ article.content }}'}</div>
      <a className="text-link" href={blog.url}>
        ← Voltar para o journal
      </a>
    </article>
  )
}
export const schema = {
  name: 'Artigo',
  settings: [],
}
