<template>
  <div class="pa-5">
    <h1 class="mb-5">TDES</h1>
    <div class="tdes-key-generation-container">
      <v-text-field
        class="tdes-key-generation-text-field"
        label="Clave"
        outlined
        hide-details
        v-model="key"
      />
      <v-btn plain @click="importKey">Importar llave</v-btn>
      <v-btn plain :disabled="key.trim().length === 0" @click="exportKey">Exportar llave</v-btn>
      <v-text-field class="tdes-text-input" label="Texto" outlined hide-details v-model="text" />
      <v-btn
        class="tdes-text-encrypt-btn"
        plain
        :disabled="text.trim().length === 0 || key.trim().length === 0"
        @click="encrypt"
      >
        Encriptar
      </v-btn>
      <v-btn
        class="tdes-text-encrypt-btn"
        plain
        :disabled="text.trim().length === 0 || key.trim().length === 0"
        @click="unencrypt"
      >
        Desencriptar
      </v-btn>
      <v-btn class="tdes-text-import-btn" plain @click="importText">Importar</v-btn>
      <v-textarea
        class="tdes-result"
        auto-grow
        filled
        label="Resultado"
        readonly
        hide-details
        v-model="result"
      />
      <v-btn class="tdes-result-export-btn" plain @click="exportText">Exportar</v-btn>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      key: '',
      text: '',
      result: '',
    };
  },
  mounted() {
    window.ipcRenderer.receive('fromMain', (e) => {
      if (e.method === 'result-tdes') {
        this.result = e.payload;
      }

      if (e.method === 'result-import-tdes') {
        const { payload: { key } } = e;
        this.key = key;
      }

      if (e.method === 'result-import-text') {
        this.text = e.payload;
      }
    });
  },
  methods: {
    importText() {
      window.ipcRenderer.send('toMain', {
        method: 'import-text',
      });
    },
    exportText() {
      window.ipcRenderer.send('toMain', {
        method: 'export-text',
        payload: this.result,
      });
    },
    encrypt() {
      window.ipcRenderer.send('toMain', {
        method: 'encrypt-tdes',
        payload: {
          key: this.key,
          text: this.text,
        },
      });
    },
    unencrypt() {
      window.ipcRenderer.send('toMain', {
        method: 'unencrypt-tdes',
        payload: {
          key: this.key,
          text: this.text,
        },
      });
    },
    exportKey() {
      window.ipcRenderer.send('toMain', {
        method: 'tdes-export',
        payload: {
          key: this.key,
        },
      });
    },
    importKey() {
      window.ipcRenderer.send('toMain', {
        method: 'tdes-import',
      });
    },
  },
};
</script>

<style>
.tdes-key-generation-container {
  display: grid;
  column-gap: 10px;
  row-gap: 15px;
  align-items: center;
}

.tdes-key-generation-text-field {
  grid-column-start: 1;
  grid-column-end: span 20;
  grid-row-start: 1;
}

.tdes-key-generation-btn {
  grid-column-start: 20;
  grid-row-start: 1;
}

.tdes-key-import-btn {
  grid-column-start: 1;
  grid-row-start: 2;
}

.tdes-key-export-btn {
  grid-column-start: 2;
  grid-row-start: 2;
}

.tdes-text-input {
  grid-column-start: 1;
  grid-column-end: span 20;
  grid-row-start: 5;
}

.tdes-text-encrypt-btn {
  grid-row-start: 6;
}

.tdes-text-import-btn {
  grid-row-start: 6;
}

.tdes-result {
  grid-row-start: 8;
  grid-column-start: 1;
  grid-column-end: span 20;
}

.tdes-result-export-btn {
  grid-row-start: 9;
}
</style>
