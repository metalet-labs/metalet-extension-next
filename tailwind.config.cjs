const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './popup.html', './src/**/*.{vue,js,ts}'],
  theme: {
    screens: {
      xs: '380px',
      ...defaultTheme.screens,
    },

    extend: {
      colors: {
        'black-primary': '#141416',
        'gray-primary': '#909399',
        'base-black': '#141416',
        'primary-teal': '#72F5F6',
        'primary-blue': '#171AFF',
        'btn-blue': '#1E2BFF',
      },
      borderRadius: {
        inherit: 'inherit',
      },
      spacing: {
        90: '22.5rem',
        150: '37.5rem',
      },
      fontFamily: {
        inter: ['Inter'],
      },
    },
  },
  plugins: [require('@headlessui/tailwindcss')],
}
