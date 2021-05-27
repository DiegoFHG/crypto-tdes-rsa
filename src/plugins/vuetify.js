import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import es from 'vuetify/lib/locale/es';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    options: {
      customProperties: true,
    },
    themes: {
      dark: {
        primary: '#1E88E5',
        accent: '#2196F3'
      }
    },
  },
  lang: {
    locales: { es },
    current: 'es',
  },
});
