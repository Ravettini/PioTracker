/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gcba: {
          blue: '#0066CC',
          'blue-light': '#3388DD',
          'blue-dark': '#004499',
          green: '#00AA88',
          'green-light': '#33BB99',
          'green-dark': '#008866',
          orange: '#FF6600',
          'orange-light': '#FF8833',
          'orange-dark': '#CC5500',
        },
        estado: {
          borrador: '#6C757D',
          pendiente: '#FFC107',
          validado: '#28A745',
          observado: '#FD7E14',
          rechazado: '#DC3545',
        },
      },
      fontFamily: {
        'archivo': ['Archivo', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
        'loading': 'loading 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        loading: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};








