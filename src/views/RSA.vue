<template>
  <div class="pa-5">
    <h1 class="mb-5">RSA</h1>
    <div class="rsa-key-generation-container">
      <v-text-field
        class="rsa-key-generation-text-field-public"
        label="Clave publica"
        outlined
        hide-details
        readonly
        v-model="publicKey"
      />
      <v-text-field
        class="rsa-key-generation-text-field-private"
        label="Clave privada"
        outlined
        hide-details
        readonly
        v-model="privateKey"
      />
      <v-btn class="rsa-key-generation-btn" plain @click="generateKeyPair">Generar claves</v-btn>
      <v-btn class="rsa-key-import-btn" plain @click="importKeys">Importar claves</v-btn>
      <v-btn
        class="rsa-key-export-btn"
        plain :disabled="privateKey === '' || publicKey === ''"
        @click="exportKeys"
      >
        Exportar claves
      </v-btn>
      <v-text-field class="rsa-text-input" label="Texto" outlined hide-details v-model="text" />
      <v-btn
        class="rsa-text-encrypt-btn"
        plain
        :disabled="publicKey === '' || privateKey === '' || text.trim().length === 0"
        @click="encrypt"
      >
        Encriptar
      </v-btn>
      <v-btn
        class="rsa-text-encrypt-btn"
        plain
        :disabled="publicKey === '' || privateKey === '' || text.trim().length === 0"
        @click="unencrypt"
      >
        Desencriptar
      </v-btn>
      <v-btn class="rsa-text-import-btn" plain @click="importText">Importar</v-btn>
      <v-textarea
        class="rsa-result"
        auto-grow
        filled
        label="Resultado"
        readonly
        hide-details
        v-model="result"
      />
      <v-btn class="rsa-result-export-btn" plain @click="exportText">Exportar</v-btn>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      publicKey: '',
      privateKey: '',
      text: '',
      result: '',
    };
  },
  mounted() {
    window.ipcRenderer.receive('fromMain', (e) => {
      if (e.method === 'result-rsa-keypair') {
        this.publicKey = e.payload.publicKey;
        this.privateKey = e.payload.privateKey;
      }

      if (e.method === 'result-rsa') {
        this.result = e.payload;
      }

      if (e.method === 'result-import-rsa') {
        const { payload: { publicKey, privateKey } } = e;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
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
    generateKeyPair() {
      window.ipcRenderer.send('toMain', {
        method: 'rsa-generate-keypair',
      });
    },
    encrypt() {
      window.ipcRenderer.send('toMain', {
        method: 'rsa-encrypt',
        payload: {
          publicKey: this.publicKey,
          text: this.text,
        },
      });
    },
    unencrypt() {
      window.ipcRenderer.send('toMain', {
        method: 'rsa-unencrypt',
        payload: {
          privateKey: this.privateKey,
          text: this.text,
        },
      });
    },
    importKeys() {
      window.ipcRenderer.send('toMain', {
        method: 'rsa-import',
      });
    },
    exportKeys() {
      window.ipcRenderer.send('toMain', {
        method: 'rsa-export',
        payload: {
          publicKey: this.publicKey,
          privateKey: this.privateKey,
        },
      });
    },
  },
};
</script>

<style>
.rsa-key-generation-container {
  display: grid;
  column-gap: 10px;
  row-gap: 15px;
  align-items: center;
}

.rsa-key-generation-text-field-public {
  grid-column-start: 1;
  grid-column-end: 20;
  grid-row-start: 1;
}

.rsa-key-generation-text-field-private {
  grid-column-start: 1;
  grid-column-end: 20;
  grid-row-start: 2;
}

.rsa-key-generation-btn {
  grid-column-start: 20;
  grid-row-start: 1;
  grid-row-end: 3;
}

.rsa-key-import-btn {
  grid-column-start: 1;
  grid-row-start: 3;
}

.rsa-key-export-btn {
  grid-column-start: 2;
  grid-row-start: 3;
}

.rsa-text-input {
  grid-column-start: 1;
  grid-column-end: span 20;
  grid-row-start: 5;
}

.rsa-text-encrypt-btn {
  grid-row-start: 6;
}

.rsa-result {
  grid-row-start: 8;
  grid-column-start: 1;
  grid-column-end: span 20;
}

.rsa-result-export-btn {
  grid-row-start: 9;
}

.rsa-text-import-btn {
  grid-row-start: 6;
}
</style>
