<template>
  <v-app>
    <v-app-bar
      app
      color="black"
      dark
    >
      <span>Criptografia</span>
      <v-spacer />
      <v-btn text @click="changeRoute('/TDES')" :disabled="currentRoute === 0">TDES</v-btn>
      <v-btn text @click="changeRoute('/RSA')" :disabled="currentRoute === 1" class="ml-2">RSA</v-btn>
    </v-app-bar>
    <v-main class="main-container">
      <v-snackbar v-model="showInvalidTextSnackbar" multi-line>
        <div v-if="code === '01'">
          <b class="red--text">Desencripcion fallida</b>
          <br />
          <span>Texto encriptado invalido</span>
        </div>
        <div v-if="code === '02'">
          <b class="red--text">Encriptacion fallida</b>
          <br />
          <span>Texto a encriptar muy largo para el tamaño de la llave.</span>
        </div>
        <div v-if="code === '03'">
          <b class="red--text">Desencriptacion fallida</b>
          <br />
          <span>Llave invalida.</span>
        </div>
      </v-snackbar>
      <div class="card-container">
        <v-card class="card">
          <router-view />
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    currentRoute: 0,
    showInvalidTextSnackbar: false,
    code: '',
  }),
  mounted() {
    window.ipcRenderer.receive('fromMain', (e) => {
      if (e.method === 'show-snack-bar') {
        const { payload: { code } } = e;

        this.showInvalidTextSnackbar = true;
        this.code = code;
      }
    });
  },
  methods: {
    changeRoute(route) {
      this.$router.push(route);

      if (route === '/TDES') this.currentRoute = 0;
      else if (route === '/RSA') this.currentRoute = 1;
    },
  },
};
</script>
<style>
body, html {
  height: 100%;
}

.main-container {
  display: flex !important;
  flex-direction: row !important;
  justify-content: center !important;
  height: 100%;
  width: 100%;
}

.card-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 3%;
  margin-bottom: 3%;
}

.card {
  width: clamp(20rem, 90vw, 60rem);
  padding: clamp(5px, 10px, 20px)
}
</style>
