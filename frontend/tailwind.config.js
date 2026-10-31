/** @type {import('tailwindcss').Config} */
// Tailwind compilado en build (antes: Play CDN en el navegador).
// Tema negro del sitio público: superficies/tinta en styles.css; marca (action/accent) desde el admin.
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
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Títulos y cifras grandes (redondeada, con carácter)
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Compatibilidad (admin / ThemeContext)
        'background-primary': 'rgb(var(--color-background-primary) / <alpha-value>)',
        'background-secondary': 'rgb(var(--color-background-secondary) / <alpha-value>)',
        // Marca configurable desde el admin
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'action': 'rgb(var(--color-action) / <alpha-value>)',
        'accent-ink': 'var(--accent-ink)',
        'action-ink': 'var(--action-ink)',
        // Superficies y tinta del tema negro
        'page': 'rgb(var(--surface-page) / <alpha-value>)',
        'surface': 'rgb(var(--surface-card) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'ink': 'rgb(var(--ink) / <alpha-value>)',
        'muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        // Línea: blanco con alpha (border-line = 8 %, border-line/20 para resaltar)
        'line': 'rgb(var(--line) / 0.08)',
        'line-strong': 'rgb(var(--line) / 0.18)',
      },
      boxShadow: {
        'soft': '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 10px 30px -14px rgb(0 0 0 / 0.7)',
        'lift': '0 1px 0 rgb(255 255 255 / 0.06) inset, 0 24px 50px -20px rgb(0 0 0 / 0.8)',
        // Relieve de botón (tipo pastilla): base más oscura del mismo color
        'press-action': '0 4px 0 0 var(--action-deep)',
        'press-action-down': '0 1px 0 0 var(--action-deep)',
        'press-accent': '0 4px 0 0 var(--accent-deep)',
        'press-whatsapp': '0 4px 0 0 #128C7E',
        'press-whatsapp-down': '0 1px 0 0 #128C7E',
        'press-hot': '0 4px 0 0 #9E0000',
        'press-hot-down': '0 1px 0 0 #9E0000',
        'raised': '0 -8px 30px -12px rgb(0 0 0 / 0.8)',
      },
      fontSize: {
        'display': ['clamp(2rem, 3.2vw + 0.9rem, 3.25rem)', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'title': ['clamp(1.5rem, 1.6vw + 0.9rem, 2.125rem)', { lineHeight: '1.14', letterSpacing: '-0.01em' }],
        'heading': ['clamp(1.25rem, 1vw + 0.9rem, 1.625rem)', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
      },
      keyframes: {
        'page-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'page-in-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        'drop-in': { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'none' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '0.7' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        'pop': { '0%': { transform: 'scale(0.9)' }, '60%': { transform: 'scale(1.06)' }, '100%': { transform: 'scale(1)' } },
        'wiggle': { '0%, 100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        // "rotate" del admin: balanceo suave, no un giro completo (ilegible en un logo con texto)
        'logo-rotate': { '0%, 100%': { transform: 'rotate(-7deg)' }, '50%': { transform: 'rotate(7deg)' } },
        'logo-pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
        'logo-bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'page-in': 'page-in 0.2s ease-out both',
        'page-in-up': 'page-in-up 0.3s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drop-in': 'drop-in 0.25s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'logo-rotate': 'logo-rotate 3.6s ease-in-out infinite',
        'logo-pulse': 'logo-pulse 2.6s ease-in-out infinite',
        'logo-bounce': 'logo-bounce 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
