/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          deep: '#5D8E67',
          soft: '#9FD89C',
        },
        cream: '#F9F5ED',
        yellow: {
          soft: '#FEE188',
        },
        peach: '#FFD1BD',
        blue: {
          soft: '#B7E3FF',
        },
      },
      fontFamily: {
        comfortaa: ['Comfortaa', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'grid-paper': `
          linear-gradient(rgba(93,142,103,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(93,142,103,0.07) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '28px 28px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(93,142,103,0.1)',
        'card': '0 2px 16px rgba(93,142,103,0.12)',
        'card-hover': '0 8px 32px rgba(93,142,103,0.18)',
      },
    },
  },
  plugins: [],
};
