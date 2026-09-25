export const EMPTY_STATE_SCHEMA = {
	name: 'Estado vazio',
	tag: 'div',
	settings: [
		{
			type: 'text',
			id: 'heading',
			label: 'Título',
			default: 'Seu carrinho está vazio',
		},
		{
			type: 'textarea',
			id: 'text',
			label: 'Texto',
			default: 'Navegue pelos produtos e encontre o que combina com você.',
		},
		{
			type: 'text',
			id: 'action_label',
			label: 'Texto do botão',
			default: 'Ver produtos',
		},
		{
			type: 'url',
			id: 'action_link',
			label: 'Link do botão',
		},
	],
	presets: [
		{
			name: 'Estado vazio',
		},
	],
}
