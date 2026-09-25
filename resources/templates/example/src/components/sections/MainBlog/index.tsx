'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import { Pagination } from '../../snippets/Pagination'

import styles from './styles.css'

export const MainBlog = () => {
  return (
    <section className="container section-space">
      <div className="page-heading">
        <p className="eyebrow">{"'blog.eyebrow' | t"}</p>
        <h1>{'blog.title | escape'}</h1>
      </div>
      <PaginateByLiquid collection={blog.articles} by={9}>
        <div className="journal-grid">
          {blog.articles.map((post) => (
            <article>
              <a href={post.url}>
                {post.image && (
                  <img
                    src="{{ post.image | image_url: width: 900 }}"
                    alt="{{ post.image.alt | default: post.title | escape }}"
                    width="900"
                    height="650"
                    loading="lazy"
                  />
                )}
                <p className="eyebrow">{'post.published_at | date: "%d.%m.%Y"'}</p>
                <h2>{'post.title | escape'}</h2>
                <span className="text-link">{"'blog.read_story' | t"}</span>
              </a>
            </article>
          ))}
        </div>
        <RenderSnippet slot={Pagination} pager={paginate} />
      </PaginateByLiquid>
    </section>
  )
}
export const schema = {
  name: 't:sections.main_blog.name',
  settings: [],
}
