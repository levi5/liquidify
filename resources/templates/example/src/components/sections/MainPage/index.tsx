'use sections'

import styles from './styles.css'

export const MainPage = () => {
  return (
    <section className="content-page container section-space">
      <p className="eyebrow">{"'page.eyebrow' | t"}</p>
      <h1>{'page.title | escape'}</h1>
      <div className="rich-text page-content">{'{{ page.content }}'}</div>
    </section>
  )
}
export const schema = {
  name: 't:sections.main_page.name',
  settings: [],
}
