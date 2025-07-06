module.exports = {
  content: ['./views/**/*.ejs'],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['dim']   // or pick any DaisyUI theme you like
  },
}
