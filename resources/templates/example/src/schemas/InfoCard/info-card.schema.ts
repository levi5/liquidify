export const INFO_CARD_SCHEMA = {
	name: 't:sections.info_card.name',
	tag: 'section',
	class: 'section',
	max_blocks: 16,
	blocks: [
		{
			type: 'card',
			name: 't:sections.info_card.blocks.card.name',
			settings: [
				{
					type: 'image_picker',
					id: 'image',
					label: 't:sections.info_card.blocks.card.settings.image.label',
				},
				{
					type: 'text',
					id: 'title',
					label: 't:sections.info_card.blocks.card.settings.title.label',
					default: 'Transforme seu Quarto em um Refúgio de Conforto',
				},
				{
					type: 'textarea',
					id: 'description',
					label: 't:sections.info_card.blocks.card.settings.description.label',
					default: 'Descubra o prazer de relaxar em um ambiente pensado para o seu bem-estar.',
				},
				{
					type: 'text',
					id: 'button_label',
					label: 't:sections.info_card.blocks.card.settings.button_label.label',
					default: 'DESCOBRIR',
				},
				{
					type: 'url',
					id: 'button_link',
					label: 't:sections.info_card.blocks.card.settings.button_link.label',
				},
				{
					type: 'select',
					id: 'layout',
					label: 't:sections.info_card.blocks.card.settings.layout.label',
					options: [
						{ value: 'left', label: 't:sections.info_card.blocks.card.settings.layout.options.left.label' },
						{ value: 'right', label: 't:sections.info_card.blocks.card.settings.layout.options.right.label' },
					],
					default: 'left',
				},
				{
					type: 'color',
					id: 'background_color',
					label: 't:sections.info_card.blocks.card.settings.background_color.label',
					default: '#EDE7F6',
				},
			],
		},
	],
	presets: [
		{
			name: 't:sections.info_card.presets.default',
			blocks: [{ type: 'card' }],
		},
	],
}
