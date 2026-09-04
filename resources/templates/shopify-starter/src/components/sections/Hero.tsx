"use sections"
import { RenderSnippet } from 'liquidify'
import { Counter } from '../islands/Counter'

export const Hero = () => {
  return (
    <section
      style={{
        padding: '5rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div className="container">
        <RenderSnippet slot="badge" text="🚀 Liquidify + Shopify Starter" />
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
          {section.settings.heading}
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          {section.settings.subheading}
        </p>

        <Counter initialCount={5} />
      </div>
    </section>
  )
}

export const schema = {
  name: 'Hero Banner',
  settings: [
    {
      type: 'text',
      id: 'heading',
      label: 'Heading',
      default: 'Build Shopify Themes with TSX',
    },
    {
      type: 'text',
      id: 'subheading',
      label: 'Subheading',
      default: 'Write React/TSX components and let Liquidify compile them to clean Shopify Liquid.',
    },
  ],
  presets: [
    {
      name: 'Hero Banner',
    },
  ],
}
