'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { ThemeIcon } from '../../snippets/ThemeIcon'

import styles from './styles.css'

export const Values = () => {
  return (
    <section className={classNames(styles['values-strip'], 'container')} aria-label={"'values.strip_label' | t"}>
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="truck" />
        <div>
          <h3>{"'values.shipping_title' | t"}</h3>
          <p>{"'values.shipping_text' | t"}</p>
        </div>
      </div>
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="shield" />
        <div>
          <h3>{"'values.secure_title' | t"}</h3>
          <p>{"'values.secure_text' | t"}</p>
        </div>
      </div>
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="return" />
        <div>
          <h3>{"'values.support_title' | t"}</h3>
          <p>{"'values.support_text' | t"}</p>
        </div>
      </div>
    </section>
  )
}
export const schema = { name: 't:sections.values.name', settings: [], presets: [{ name: 't:sections.values.presets.default' }] }
