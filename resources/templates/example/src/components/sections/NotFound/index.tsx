'use sections'

import styles from './styles.css'

export const NotFound = () => {
  return (
    <section className="empty-state not-found container">
      <p className="eyebrow">{"'not_found.eyebrow' | t"}</p>
      <span className="empty-spark">✳</span>
      <h1>{"'not_found.heading' | t"}</h1>
      <p>{"'not_found.text' | t"}</p>
      <a className="button button-dark" href={routes.root_url}>
        {"'not_found.back_home' | t"}
      </a>
    </section>
  )
}
export const schema = {
  name: 't:sections.not_found.name',
  settings: [],
}
