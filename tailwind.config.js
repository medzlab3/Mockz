/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mockz Signature Gold (#ffc300 base)
        gold: {
          50:  '#fffdf0',
          100: '#fff9d6',
          200: '#fff1a8',
          300: '#ffe570',
          400: '#ffc300', // Base
          500: '#e6ab00',
          600: '#bf8c00',
          700: '#996f00',
          800: '#735200',
          900: '#4d3600',
          950: '#2b1e00',
        },
        // Alias brand to gold
        brand: {
          50:  '#fffdf0',
          100: '#fff9d6',
          200: '#fff1a8',
          300: '#ffe570',
          400: '#ffc300',
          500: '#e6ab00',
          600: '#bf8c00',
          700: '#996f00',
          800: '#735200',
          900: '#4d3600',
          950: '#2b1e00',
        },
        // Warm luxury dark neutrals derived from gold/charcoal (ZERO blue)
        dark: {
          50:  '#faf7ef',
          100: '#f3ede0',
          200: '#e6dac3',
          300: '#d4c29f',
          400: '#a8946f',
          500: '#7d6c4d',
          600: '#52452f',
          700: '#382e1d',
          750: '#2a2215',
          800: '#1e180f',
          850: '#17120a',
          900: '#110d07',
          950: '#0a0804',
        },
        // Override all default Tailwind neutral names to prevent any blue slate leak
        slate: {
          50:  '#faf7ef',
          100: '#f3ede0',
          200: '#e6dac3',
          300: '#d4c29f',
          400: '#a8946f',
          500: '#7d6c4d',
          600: '#52452f',
          700: '#382e1d',
          750: '#2a2215',
          800: '#1e180f',
          850: '#17120a',
          900: '#110d07',
          950: '#0a0804',
        },
        zinc: {
          50:  '#faf7ef',
          100: '#f3ede0',
          200: '#e6dac3',
          300: '#d4c29f',
          400: '#a8946f',
          500: '#7d6c4d',
          600: '#52452f',
          700: '#382e1d',
          750: '#2a2215',
          800: '#1e180f',
          850: '#17120a',
          900: '#110d07',
          950: '#0a0804',
        },
      }
    },
  },
  plugins: [],
}
