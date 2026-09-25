export const INFO_CARD_SCHEMA = {
	name: 'Info Cards',
	tag: 'section',
	class: 'section',
	max_blocks: 16,
	blocks: [
		{
			type: 'card',
			name: 'Info Card',
			settings: [
				{
					type: 'image_picker',
					id: 'image',
					label: 'Imagem',
				},
				{
					type: 'text',
					id: 'title',
					label: 'Título',
					default: 'Transforme seu Quarto em um Refúgio de Conforto',
				},
				{
					type: 'textarea',
					id: 'description',
					label: 'Descrição',
					default: 'Descubra o prazer de relaxar em um ambiente pensado para o seu bem-estar.',
				},
				{
					type: 'text',
					id: 'button_label',
					label: 'Texto do botão',
					default: 'DESCOBRIR',
				},
				{
					type: 'url',
					id: 'button_link',
					label: 'Link do botão',
				},
				{
					type: 'select',
					id: 'layout',
					label: 'Posição da imagem',
					options: [
						{ value: 'left', label: 'Imagem à esquerda' },
						{ value: 'right', label: 'Imagem à direita' },
					],
					default: 'left',
				},
				{
					type: 'color',
					id: 'background_color',
					label: 'Cor de fundo',
					default: '#EDE7F6',
				},
			],
		},
	],
	presets: [
		{
			name: 'Info Cards',
			blocks: [{ type: 'card' }],
		},
	],
}
