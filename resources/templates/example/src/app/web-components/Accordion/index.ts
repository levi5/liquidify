'use script'

type AccordionType = 'single' | 'multiple'

class MyAccordion extends HTMLElement {
	get type(): AccordionType {
		const value = this.getAttribute('type')
		return value === 'multiple' ? 'multiple' : 'single'
	}

	notifyOpen(openedItem: MyAccordionItem): void {
		if (this.type !== 'single') return

		const items = this.querySelectorAll('my-accordion-item')

		items.forEach((item) => {
			const accordionItem = item as MyAccordionItem

			if (accordionItem !== openedItem) {
				accordionItem.close()
			}
		})
	}

	connectedCallback(): void {
		if (this.type !== 'single') return

		const items = Array.from(this.querySelectorAll('my-accordion-item')) as MyAccordionItem[]

		let foundOpen = false

		items.forEach((item) => {
			if (item.isOpen()) {
				if (!foundOpen) {
					foundOpen = true
					item.update()
				} else {
					item.close()
				}
			} else {
				item.update()
			}
		})
	}
}

class MyAccordionItem extends HTMLElement {
	connectedCallback(): void {
		this.update()
	}

	isOpen(): boolean {
		return this.hasAttribute('open')
	}

	open(): void {
		this.setAttribute('open', '')
		this.update()

		const accordion = this.closest('my-accordion') as MyAccordion | null
		accordion?.notifyOpen(this)
	}

	close(): void {
		this.removeAttribute('open')
		this.update()
	}

	toggle(): void {
		if (this.isOpen()) {
			this.close()
		} else {
			this.open()
		}
	}

	update(): void {
		const content = this.querySelector('my-accordion-content') as MyAccordionContent | null

		this.setAttribute('data-state', this.isOpen() ? 'open' : 'closed')

		if (content) {
			content.style.display = this.isOpen() ? 'block' : 'none'
		}
	}
}

class MyAccordionTrigger extends HTMLElement {
	private onClick = (): void => {
		const item = this.closest('my-accordion-item') as MyAccordionItem | null
		item?.toggle()
	}

	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()

			const item = this.closest('my-accordion-item') as MyAccordionItem | null
			item?.toggle()
		}
	}

	connectedCallback(): void {
		this.setAttribute('role', 'button')
		this.setAttribute('tabindex', '0')

		this.addEventListener('click', this.onClick)
		this.addEventListener('keydown', this.onKeydown)
	}

	disconnectedCallback(): void {
		this.removeEventListener('click', this.onClick)
		this.removeEventListener('keydown', this.onKeydown)
	}
}

class MyAccordionContent extends HTMLElement {}

customElements.define('my-accordion', MyAccordion)
customElements.define('my-accordion-item', MyAccordionItem)
customElements.define('my-accordion-trigger', MyAccordionTrigger)
customElements.define('my-accordion-content', MyAccordionContent)
