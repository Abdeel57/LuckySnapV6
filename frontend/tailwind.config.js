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
        // Brillos de casino: anillo tenue + halo
        'glow-action': '0 0 0 1px rgb(var(--color-action) / 0.55), 0 0 28px rgb(var(--color-action) / 0.45)',
        'glow-accent': '0 0 0 1px rgb(var(--color-accent) / 0.55), 0 0 28px rgb(var(--color-accent) / 0.4)',
        'glow-gold': '0 0 0 1px rgb(251 191 36 / 0.5), 0 0 28px rgb(251 191 36 / 0.35)',
        'card-hover': '0 18px 40px -18px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.12)',
      },
      fontSize: {
        'display': ['clamp(2rem, 4.5vw + 0.5rem, 3.25rem)', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'title': ['clamp(1.5rem, 2.2vw + 0.6rem, 2.125rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      // Entrada de página (PageAnimator): mismas curvas que tenía con framer-motion
      keyframes: {
        'page-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'page-in-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'none' } },
        // Microinteracciones y ambiente (solo transform/opacity: baratas en móvil)
        'fade-up': { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'none' } },
        'pop': { '0%': { transform: 'scale(0.82)' }, '60%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } },
        'drop-in': { from: { opacity: '0', transform: 'translateY(-12px) scale(0.85)' }, to: { opacity: '1', transform: 'none' } },
        'float': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'glow': { '0%, 100%': { opacity: '0.45' }, '50%': { opacity: '1' } },
        'blink': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '0.8' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        'shimmer': { from: { transform: 'translateX(-160%) skewX(-18deg)' }, to: { transform: 'translateX(220%) skewX(-18deg)' } },
        'ticker': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'reel': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'confetti': { '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(180px) rotate(600deg)', opacity: '0' } },
        // "rotate" del admin: balanceo suave, no un giro completo (ilegible en un logo con texto)
        'logo-rotate': { '0%, 100%': { transform: 'rotate(-7deg)' }, '50%': { transform: 'rotate(7deg)' } },
        'logo-pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
        'logo-bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'page-in': 'page-in 0.2s ease-out both',
        'page-in-up': 'page-in-up 0.3s ease-out both',
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop': 'pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'drop-in': 'drop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'float': 'float 5s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow': 'glow 2.4s ease-in-out infinite',
        'blink': 'blink 1s steps(1, end) infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        'shimmer': 'shimmer 1.1s ease-in-out',
        'shimmer-loop': 'shimmer 2.8s ease-in-out infinite',
        'ticker': 'ticker 32s linear infinite',
        'reel': 'reel 0.45s linear infinite',
        'reel-fast': 'reel 0.3s linear infinite',
        'spin-slow': 'spin-slow 36s linear infinite',
        'confetti': 'confetti 1.6s ease-in both',
        'logo-rotate': 'logo-rotate 3.6s ease-in-out infinite',
        'logo-pulse': 'logo-pulse 2.6s ease-in-out infinite',
        'logo-bounce': 'logo-bounce 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
