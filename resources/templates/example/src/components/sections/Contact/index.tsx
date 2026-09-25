'use sections'

import { FormBlock } from 'liquidify'

import styles from './styles.css'

export const Contact = () => {
  return (
    <section className="contact-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">{"'contact.eyebrow' | t"}</p>
        <h1>{page.title ? 'page.title | escape' : "'contact.title_fallback' | t"}</h1>
        <div className="rich-text">{'{{ page.content }}'}</div>
      </div>
      <FormBlock name="contact" id="ContactForm" className="contact-form">
        {form['posted_successfully?'] ? (
          <p className="form-success" role="status">
            {"'contact.success' | t"}
          </p>
        ) : (
          <>
            <div className="form-row">
              <label>
                {"'contact.name' | t"}
                <input type="text" name="contact[name]" autoComplete="name" required />
              </label>
              <label>
                {"'contact.email' | t"}
                <input type="email" name="contact[email]" autoComplete="email" required />
              </label>
            </div>
            <label>
              {"'contact.phone' | t"}
              <input type="tel" name="contact[phone]" autoComplete="tel" />
            </label>
            <label>
              {"'contact.message_label' | t"}
              <textarea name="contact[body]" rows={6} required></textarea>
            </label>
            {form.errors && (
              <div className="form-error" role="alert">
                {'form.errors | default_errors'}
              </div>
            )}
            <button className="button button-dark" type="submit">
              {"'contact.send' | t"}
            </button>
          </>
        )}
      </FormBlock>
    </section>
  )
}
export const schema = {
  name: 't:sections.contact.name',
  settings: [],
}
