export const NEWSLETTER_SCHEMA = {
	name: 't:sections.newsletter.name',
	settings: [
		{
			type: 'text',
			id: 'eyebrow',
			label: 't:sections.newsletter.settings.eyebrow.label',
			default: 'VAMOS FICAR MAIS PERTO?',
		},
		{
			type: 'text',
			id: 'title_1',
			label: 't:sections.newsletter.settings.title_1.label',
			default: 'Entre para a nossa lista.',
		},
		{
			type: 'text',
			id: 'title_2',
			label: 't:sections.newsletter.settings.title_2.label',
			default: 'Fique por dentro do próximo drop.',
		},
		{
			type: 'text',
			id: 'label',
			label: 't:sections.newsletter.settings.label.label',
			default: 'Seu melhor e-mail',
		},
		{
			type: 'text',
			id: 'note',
			label: 't:sections.newsletter.settings.note.label',
			default: 'Novidades, lançamentos e inspiração. Cancele quando quiser.',
		},
		{
			type: 'color',
			id: 'background',
			label: 't:sections.newsletter.settings.background.label',
			default: '#f4f4f4',
		},
	],
	presets: [
		{
			name: 't:sections.newsletter.presets.default',
		},
	],
}
