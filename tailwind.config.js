/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        'muted-foreground': 'var(--muted)',
        card: 'var(--card)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
};
