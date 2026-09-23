'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { ThemeIcon } from '../../snippets/ThemeIcon'

import styles from './styles.css'

export const Values = () => {
  return (
    <section className={classNames(styles['values-strip'], 'container')} aria-label="Shop with confidence">
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="truck" />
        <div>
          <h3>Your way, to you</h3>
          <p>Check delivery options at checkout</p>
        </div>
      </div>
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="shield" />
        <div>
          <h3>Secure purchase</h3>
          <p>Your data protected at every step</p>
        </div>
      </div>
      <div className={classNames(styles['value-item'])}>
        <RenderSnippet slot={ThemeIcon} name="return" />
        <div>
          <h3>Count on us</h3>
          <p>Support to help with your choice</p>
        </div>
      </div>
    </section>
  )
}
export const schema = { name: 'Store Benefits', settings: [], presets: [{ name: 'Store Benefits' }] }
