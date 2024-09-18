const animate = require('tailwindcss-animate')
const headlessui = require('@headlessui/tailwindcss')
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
      spacing: {
        4.5: '1.125rem',
        7.5: '1.875rem',
      },
      colors: {
        'black-primary': '#141416',
        'black-secondary': '#303133',
        'gray-primary': '#909399',
        'gray-line': '#BFC2CC',
        'gray-soft': '#EDEFF2',
        'gray-secondary': '#F5F7F9',
        'gray-light': '#F5F7FA',
        'primary-teal': '#72F5F6',
        'blue-primary': '#171AFF',
        'blue-light': '#F3F3FF',
        'btn-blue': '#1E2BFF',
        'orange-primary': '#FF8F1F',
        'slate-light': '#606266',
        'red-primary': '#FA5151',
        'green-success': '#00B578',
        runes: '#14b8a6',
        bridge: '#6e66fa',
      },
      fontSize: {
        ss: ['0.8125rem', '1.125rem'],
      },
      borderRadius: {
        inherit: 'inherit',
      },
      spacing: {
        90: '22.5rem',
        150: '37.5rem',
      },
      width: {
        4.5: '1.125rem',
        7.5: '1.875rem',
        15: '3.75rem',
        22.5: '5.625rem',
        30: '7.5rem',
        32.5: '8.125rem',
        61.5: '15.375rem',
        82: '20.5rem',
      },
      height: {
        15: '3.75rem',
        18: '4.5rem',
        45: '11.25rem',
        85: '22.5rem',
      },
      maxWidth: {
        15: '3.75rem',
        18: '4.5rem',
      },
      lineHeight: {
        15: '3.75rem',
      },
      margin: {
        15: '3.75rem',
        26: '6.5rem',
      },
      padding: {
        7.5: '1.875rem',
        22.5: '5.625rem',
      },
      gap: {
        15: '3.75rem',
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
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
        'drawer-modal-up': {
          from: { transform: 'translate3d(0, 100%, 0)' },
          to: { transform: 'translate3d(0, 0, 0)' },
        },
        'drawer-modal-down': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(0, 100%, 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out',
        'drawer-modal-up': 'drawer-modal-up 0.5s cubic-bezier(.32,.72,0,1)',
        'drawer-modal-down': 'drawer-modal-down 0.5s cubic-bezier(.32,.72,0,1)',
      },
    },
  },
  plugins: [animate, headlessui],
}
