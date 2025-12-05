/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset to preserve theme's CSS variables
  },
  content: [
    './layout/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
    './templates/**/*.liquid',
    './templates/**/*.json',
    './assets/*.js',
  ],
  theme: {
    // Override default spacing to use rem with base 10px (html font-size: 62.5%)
    // This maintains accessibility while compensating for the theme's base
    // Note: With 1rem = 10px, these values will scale with user's browser font size
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.2rem',   // 2px at base, scales with user preference
      1: '0.4rem',     // 4px at base
      1.5: '0.6rem',   // 6px at base
      2: '0.8rem',     // 8px at base
      2.5: '1rem',     // 10px at base
      3: '1.2rem',     // 12px at base
      3.5: '1.4rem',   // 14px at base
      4: '1.6rem',     // 16px at base
      5: '2rem',       // 20px at base
      6: '2.4rem',     // 24px at base
      7: '2.8rem',     // 28px at base
      8: '3.2rem',     // 32px at base
      9: '3.6rem',     // 36px at base
      10: '4rem',      // 40px at base
      11: '4.4rem',    // 44px at base
      12: '4.8rem',    // 48px at base
      14: '5.6rem',    // 56px at base
      16: '6.4rem',    // 64px at base
      20: '8rem',      // 80px at base
      24: '9.6rem',    // 96px at base
      28: '11.2rem',   // 112px at base
      32: '12.8rem',   // 128px at base
      36: '14.4rem',   // 144px at base
      40: '16rem',     // 160px at base
      44: '17.6rem',   // 176px at base
      48: '19.2rem',   // 192px at base
      52: '20.8rem',   // 208px at base
      56: '22.4rem',   // 224px at base
      60: '24rem',     // 240px at base
      64: '25.6rem',   // 256px at base
      72: '28.8rem',   // 288px at base
      80: '32rem',     // 320px at base
      96: '38.4rem',   // 384px at base
    },
    // Override font sizes to use rem with base 10px
    // This maintains accessibility and proper scaling with user preferences
    fontSize: {
      xs: ['1.2rem', { lineHeight: '1.6rem' }],      // 12px at base
      sm: ['1.4rem', { lineHeight: '2rem' }],        // 14px at base
      base: ['1.6rem', { lineHeight: '2.4rem' }],    // 16px at base
      lg: ['1.8rem', { lineHeight: '2.8rem' }],      // 18px at base
      xl: ['2rem', { lineHeight: '2.8rem' }],        // 20px at base
      '2xl': ['2.4rem', { lineHeight: '3.2rem' }],   // 24px at base
      '3xl': ['3rem', { lineHeight: '3.6rem' }],     // 30px at base
      '4xl': ['3.6rem', { lineHeight: '4rem' }],     // 36px at base
      '5xl': ['4.8rem', { lineHeight: '1' }],        // 48px at base
      '6xl': ['6rem', { lineHeight: '1' }],          // 60px at base
      '7xl': ['7.2rem', { lineHeight: '1' }],        // 72px at base
      '8xl': ['9.6rem', { lineHeight: '1' }],        // 96px at base
      '9xl': ['12.8rem', { lineHeight: '1' }],       // 128px at base
    },
    extend: {
      // Custom theme extensions
      colors: {
        'bw-gray-600': '#444444',
      },
      fontFamily: {
        // Add your custom fonts here
      },
      boxShadow: {
        'bw-dropdown': '3px 2px 20px 0px #bbbbbb',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

