'use sections'

export const Hero = () => {
  return (
    <section className="fashion-hero container">
      <div className="fashion-hero-copy">
        <p className="eyebrow">
          <span className="new-season-dot"></span> NEW SEASON / ESSENTIALS
        </p>
        <h1>
          {'section.settings.heading | default: "Seu estilo." | escape'}
          <br />
          <span>{'section.settings.highlight | default: "Sem limites." | escape'}</span>
        </h1>
        <p className="hero-description">{'section.settings.description | default: "Novas peças. Novas possibilidades. Encontre os essenciais que acompanham o seu ritmo." | escape'}</p>
        <a
          className="button button-dark"
          href="{{ section.settings.link | default: routes.all_products_collection_url }}"
        >
          {'section.settings.button | default: "Explorar novidades" | escape'}
          <span aria-hidden="true">↗</span>
        </a>
        <div className="hero-bottom-note">
          <span>DROP 01</span>
          <span>EXPRESSE QUEM VOCÊ É.</span>
        </div>
      </div>
      <a
        className="fashion-hero-photo hero-women"
        href="{{ section.settings.women_link | default: '/collections/all/feminino' }}"
      >
        {section.settings.image ? (
          <img
            src="{{ section.settings.image | image_url: width: 1200 }}"
            alt="{{ section.settings.image.alt | default: 'Coleção feminina Liquidify' | escape }}"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src="{{ 'liquidify-women.jpg' | asset_url }}"
            alt="Moda feminina Liquidify — estilo urbano e denim"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        )}
        <span className="hero-photo-label">
          <strong>Feminino</strong>
          <span aria-hidden="true">↗</span>
        </span>
        <span className="hero-photo-tag">THE NEW EDIT</span>
      </a>
      <a
        className="fashion-hero-photo hero-men"
        href="{{ section.settings.men_link | default: '/collections/all/masculino' }}"
      >
        {section.settings.men_image ? (
          <img
            src="{{ section.settings.men_image | image_url: width: 1000 }}"
            alt="{{ section.settings.men_image.alt | default: 'Coleção masculina Liquidify' | escape }}"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src="{{ 'liquidify-men.jpg' | asset_url }}"
            alt="Moda masculina Liquidify — jaquetas e essenciais"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        )}
        <span className="hero-photo-label">
          <strong>Masculino</strong>
          <span aria-hidden="true">↗</span>
        </span>
      </a>
    </section>
  )
}
export const schema = {
  name: 'Capa de moda',
  settings: [
    { type: 'text', id: 'heading', label: 'Título', default: 'Seu estilo.' },
    { type: 'text', id: 'highlight', label: 'Destaque', default: 'Sem limites.' },
    {
      type: 'textarea',
      id: 'description',
      label: 'Descrição',
      default: 'Novas peças. Novas possibilidades. Encontre os essenciais que acompanham o seu ritmo.',
    },
    { type: 'text', id: 'button', label: 'Botão', default: 'Explorar novidades' },
    { type: 'url', id: 'link', label: 'Link principal' },
    { type: 'image_picker', id: 'image', label: 'Foto feminina' },
    { type: 'image_picker', id: 'men_image', label: 'Foto masculina' },
    { type: 'url', id: 'women_link', label: 'Link Feminino' },
    { type: 'url', id: 'men_link', label: 'Link Masculino' },
  ],
  presets: [{ name: 'Capa de moda' }],
}
