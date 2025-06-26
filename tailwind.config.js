/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary-color)',
        'secondary': 'var(--secondary-color)',
        'accent': 'var(--accent-color)',
        'success': 'var(--success-color)',
        'light-glass': 'var(--light-glass)',
        'light-glass-hover': 'var(--light-glass-hover)',
        'light-border': 'var(--light-border)',
        'blue-light': '#38bdf8',
        'blue-mid': '#0ea5e9',
        'blue-dark': '#3b82f6',
      },
      textColor: {
        'primary': 'var(--primary-color)',
        'secondary': 'var(--secondary-color)',
        'light': 'var(--text-light)',
      },
      backgroundColor: {
        'app': 'var(--background-gradient)',
      },
      borderColor: {
        'light': 'var(--light-border)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--background-gradient)',
      },
    },
  },
  plugins: [],
}; 