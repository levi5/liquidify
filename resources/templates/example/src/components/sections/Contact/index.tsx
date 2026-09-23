'use sections'

import { FormBlock } from 'liquidify'

import styles from './styles.css'

export const Contact = () => {
  return (
    <section className="contact-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">UMA BOA CONVERSA COMEÇA AQUI</p>
        <h1>{'page.title | default: "Vamos conversar." | escape'}</h1>
        <div className="rich-text">{page.content}</div>
      </div>
      <FormBlock name="contact" id="ContactForm" className="contact-form">
        {form['posted_successfully?'] ? (
          <p className="form-success" role="status">
            Recebemos sua mensagem. Nossa equipe vai responder pelo e-mail informado.
          </p>
        ) : (
          <>
            <div className="form-row">
              <label>
                Seu nome
                <input type="text" name="contact[name]" autoComplete="name" required />
              </label>
              <label>
                E-mail
                <input type="email" name="contact[email]" autoComplete="email" required />
              </label>
            </div>
            <label>
              Telefone (opcional)
              <input type="tel" name="contact[phone]" autoComplete="tel" />
            </label>
            <label>
              Como podemos ajudar?
              <textarea name="contact[body]" rows={6} required></textarea>
            </label>
            {form.errors && (
              <div className="form-error" role="alert">
                {'form.errors | default_errors'}
              </div>
            )}
            <button className="button button-dark" type="submit">
              Enviar mensagem ↗
            </button>
          </>
        )}
      </FormBlock>
    </section>
  )
}
export const schema = {
  name: 'Formulário de contato',
  settings: [],
}
