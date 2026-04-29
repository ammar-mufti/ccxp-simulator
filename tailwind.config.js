/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  '#0D1B2A',
        ink:   '#1A2B3C',
        gold:  '#C9A84C',
        cream: '#F7F3EC',
        mist:  '#8DA4B8',
        pass:  '#2E7D5A',
        fail:  '#A63228',
        warn:  '#C07A20',
        domain: {
          strategy: '#4A9EDB',
          culture:  '#E8904A',
          voc:      '#7BC67A',
          design:   '#C97AC9',
          metrics:  '#E8C94A',
          adoption: '#7AC9C9',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

