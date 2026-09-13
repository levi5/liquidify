'use sections'

export const MainPage = () => {
  return (
    <section className="content-page container section-space">
      <p className="eyebrow">LIQUIDIFY / CONHEÇA A MARCA</p>
      <h1>{'page.title | escape'}</h1>
      <div className="rich-text page-content">{page.content}</div>
    </section>
  )
}
export const schema = {
  name: 'Página',
  settings: [],
}
