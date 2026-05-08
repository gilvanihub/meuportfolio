/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#2A8564', // Deep Teal
					light: '#76D1B1',   // Mint Green
					dark: '#1F2925',    // Dark Forest
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#76D1B1', // Mint Green
					foreground: '#18181B',
				},
				accent: {
					DEFAULT: '#0C1410', // Dark Forest (sidebar)
					foreground: '#FFFFFF',
				},
				destructive: {
					DEFAULT: '#EF4444', // Error Red
					foreground: '#FFFFFF',
				},
				muted: {
					DEFAULT: '#F5F7F8', // Light background
					foreground: '#71717A',
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#18181B',
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#18181B',
				},
				sidebar: {
					DEFAULT: '#0C1410',
					hover: '#1F2925',
				},
				positive: '#10B981',
				negative: '#EF4444',
				warning: '#F39C12',
				neutral: '#71717A',
				// New color palette from design
				forest: '#0C1410',
				teal: '#2A8564',
				mint: '#76D1B1',
				mintLight: '#D9F2E9',
				darkBg: '#0C1410',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}