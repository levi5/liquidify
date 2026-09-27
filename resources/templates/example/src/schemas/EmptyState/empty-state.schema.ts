export const EMPTY_STATE_SCHEMA = {
	name: 't:sections.empty_state.name',
	tag: 'div',
	settings: [
		{
			type: 'text',
			id: 'heading',
			label: 't:sections.empty_state.settings.heading.label',
			default: 'Seu carrinho está vazio',
		},
		{
			type: 'textarea',
			id: 'text',
			label: 't:sections.empty_state.settings.text.label',
			default: 'Navegue pelos produtos e encontre o que combina com você.',
		},
		{
			type: 'text',
			id: 'action_label',
			label: 't:sections.empty_state.settings.action_label.label',
			default: 'Ver produtos',
		},
		{
			type: 'url',
			id: 'action_link',
			label: 't:sections.empty_state.settings.action_link.label',
		},
	],
	presets: [
		{
			name: 't:sections.empty_state.presets.default',
		},
	],
}
