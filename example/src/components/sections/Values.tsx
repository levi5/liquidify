'use sections'

import { RenderSnippet } from 'liquidify'
import { ThemeIcon } from '../snippets/ThemeIcon'

export const Values = () => {
  return (
    <section className="values-strip container" aria-label="Compre com tranquilidade">
      <div className="value-item">
        <RenderSnippet slot={ThemeIcon} name="truck" />
        <div>
          <h3>Do seu jeito, até você</h3>
          <p>Consulte as opções de entrega no checkout</p>
        </div>
      </div>
      <div className="value-item">
        <RenderSnippet slot={ThemeIcon} name="shield" />
        <div>
          <h3>Compra segura</h3>
          <p>Seus dados protegidos em cada etapa</p>
        </div>
      </div>
      <div className="value-item">
        <RenderSnippet slot={ThemeIcon} name="return" />
        <div>
          <h3>Conte com a gente</h3>
          <p>Atendimento para ajudar na sua escolha</p>
        </div>
      </div>
    </section>
  )
}
export const schema = { name: 'Benefícios da loja', settings: [], presets: [{ name: 'Benefícios da loja' }] }
