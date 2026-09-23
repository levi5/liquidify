'use sections'

export const BrandStory = () => {
  return (
    <section className="brand-campaign container" id="essencia">
      <div className="campaign-copy">
        <p className="eyebrow">LIQUIDIFY / EVERYDAY CULTURE</p>
        <h2>{'section.settings.heading | default: "Vista o que faz sentido para você." | escape'}</h2>
        <p>{'section.settings.description | default: "O estilo acontece quando você se sente bem. Combine seus favoritos, descubra novas possibilidades e faça de cada dia uma expressão de quem você é." | escape'}</p>
        <a
          className="button button-dark"
          href="{{ section.settings.link | default: routes.all_products_collection_url }}"
        >
          Encontre seu essencial <span>↗</span>
        </a>
        <span className="campaign-watermark" aria-hidden="true">
          LQ.
        </span>
      </div>
      <div className="campaign-image">
        {section.settings.image ? (
          <img
            src="{{ section.settings.image | image_url: width: 1400 }}"
            alt="{{ section.settings.image.alt | default: 'Editorial Liquidify' | escape }}"
            width="1100"
            height="950"
            loading="lazy"
          />
        ) : (
          <img
            src="{{ 'liquidify-editorial.jpg' | asset_url }}"
            alt="Estilo urbano e peças para todos os dias"
            width="1100"
            height="950"
            loading="lazy"
          />
        )}
        <span>NOT JUST CLOTHES. YOUR EXPRESSION.</span>
      </div>
    </section>
  )
}
export const schema = {
  name: 'Editorial da marca',
  settings: [
    { type: 'text', id: 'heading', label: 'Título', default: 'Vista o que faz sentido para você.' },
    {
      type: 'textarea',
      id: 'description',
      label: 'Descrição',
      default:
        'O estilo acontece quando você se sente bem. Combine seus favoritos, descubra novas possibilidades e faça de cada dia uma expressão de quem você é.',
    },
    { type: 'image_picker', id: 'image', label: 'Imagem' },
    { type: 'url', id: 'link', label: 'Link' },
  ],
  presets: [{ name: 'Editorial da marca' }],
}
