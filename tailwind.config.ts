import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade visual "Francool"
        cream: '#FFFCF2', // Floral White — fundo geral
        ink: '#252422', // Carbon Black — texto principal
        paprika: '#E85E28', // Spicy Paprika — destaque / ações primárias
        amber: '#FFBA08', // Amber Flame — alertas / "quente"
        charcoal: '#403D39', // Charcoal Brown — textos secundários / bordas
        dust: '#CCC5B9', // Dust Grey — divisores / cards secundários
      },
      fontFamily: {
        heading: ['Anton', 'sans-serif'],
        'serif-accent': ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        script: ['Lobster', 'cursive'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(37, 36, 34, 0.08), 0 1px 2px rgba(37, 36, 34, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config
