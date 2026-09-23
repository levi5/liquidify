'use sections'

import styles from './styles.css'

export const NotFound = () => {
  return (
    <section className="empty-state not-found container">
      <p className="eyebrow">404 · UM PEQUENO DESVIO</p>
      <span className="empty-spark">✳</span>
      <h1>Esse look ainda não existe.</h1>
      <p>A página que você procura não está aqui. Mas há muito para descobrir.</p>
      <a className="button button-dark" href={routes.root_url}>
        Ir para o início ↗
      </a>
    </section>
  )
}
export const schema = {
  name: 'Página não encontrada',
  settings: [],
}
