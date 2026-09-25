export const NEWSLETTER_SCHEMA = {
	name: 'Newsletter',
	settings: [
		{
			type: 'text',
			id: 'eyebrow',
			label: 'Eyebrow',
			default: 'VAMOS FICAR MAIS PERTO?',
		},
		{
			type: 'text',
			id: 'title_1',
			label: 'Título (linha 1)',
			default: 'Entre para a nossa lista.',
		},
		{
			type: 'text',
			id: 'title_2',
			label: 'Título (linha 2)',
			default: 'Fique por dentro do próximo drop.',
		},
		{
			type: 'text',
			id: 'label',
			label: 'Label do campo',
			default: 'Seu melhor e-mail',
		},
		{
			type: 'text',
			id: 'note',
			label: 'Nota abaixo do campo',
			default: 'Novidades, lançamentos e inspiração. Cancele quando quiser.',
		},
		{
			type: 'color',
			id: 'background',
			label: 'Cor de fundo',
			default: '#f4f4f4',
		},
	],
	presets: [
		{
			name: 'Newsletter',
		},
	],
}
