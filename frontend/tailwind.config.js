/** @type {import('tailwindcss').Config} */
// Tailwind compilado en build (antes: Play CDN en el navegador).
// Mantener aquí las extensiones del tema; misma versión que servía el CDN (3.4.17).
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './contexts/**/*.{ts,tsx,js,jsx}',
    './hooks/**/*.{ts,tsx,js,jsx}',
    './utils/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'background-primary': 'rgb(var(--color-background-primary) / <alpha-value>)',
        'background-secondary': 'rgb(var(--color-background-secondary) / <alpha-value>)',
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'action': 'rgb(var(--color-action) / <alpha-value>)',
      },
      boxShadow: {
        'neon-accent': '0 0 5px rgb(var(--color-accent)), 0 0 10px rgb(var(--color-accent))',
        'action': '0 10px 30px -10px rgb(var(--color-action) / 0.65)',
        'raised': '0 -8px 30px -10px rgb(0 0 0 / 0.6)',
      },
      fontSize: {
        'display': ['clamp(2rem, 4.5vw + 0.5rem, 3.25rem)', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'title': ['clamp(1.5rem, 2.2vw + 0.6rem, 2.125rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      // Entrada de página (PageAnimator): mismas curvas que tenía con framer-motion
      keyframes: {
        'page-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'page-in-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'page-in': 'page-in 0.2s ease-out both',
        'page-in-up': 'page-in-up 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
