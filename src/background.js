import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import crypto from 'crypto';
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { parse } from 'js2xmlparser';
import { Parser } from 'xml2js';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }

  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

ipcMain.on('toMain', (e, args) => {
  if (args.method === 'import-text') {
    const [filePath] = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Importar',
      properties: ['openFile'],
      filters: [
        {
          name: 'txt', extensions: ['txt'],
        },
      ],
    });

    if (filePath !== undefined) {
      const data = readFileSync(filePath, 'utf8');

      e.sender.send('fromMain', {
        method: 'result-import-text',
        payload: data,
      });
    }
  }

  if (args.method === 'export-text') {
    const { payload } = args;
    const filePath = dialog.showSaveDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Exportar',
      defaultPath: 'exportado.txt',
      filters: [
        {
          name: 'txt', extensions: ['txt'],
        },
      ],
    });

    if (filePath !== undefined) {
      writeFileSync(filePath, payload);
    }
  }

  if (args.method === 'encrypt-tdes') {
    try {
      const { payload: { key, text } } = args;
      const buffer = Buffer.from(key).toString('hex');
      const newKey = buffer.padEnd(24, 0x00).slice(0, 24);

      const encrypt = crypto.createCipheriv('des-ede3', newKey.toString('hex'), '');
      encrypt.setAutoPadding(true);
      const cipher = encrypt.update(text, 'utf8', 'base64');

      e.sender.send('fromMain', {
        method: 'result-tdes',
        payload: cipher + encrypt.final('base64'),
      });
    } catch (err) {
      console.log(err);
    }
  }

  if (args.method === 'unencrypt-tdes') {
    try {
      const { payload: { key, text } } = args;
      const buffer = Buffer.from(key).toString('hex');
      const newKey = buffer.padEnd(24, 0x00).slice(0, 24);

      const decrypt = crypto.createDecipheriv('des-ede3', newKey.toString('hex'), '');
      const uncipher = decrypt.update(text, 'base64', 'utf8');

      e.sender.send('fromMain', {
        method: 'result-tdes',
        payload: uncipher + decrypt.final('utf8'),
      });
    } catch ({ code }) {
      console.log(code);

      if (code === 'ERR_OSSL_WRONG_FINAL_BLOCK_LENGTH') {
        e.sender.send('fromMain', {
          method: 'show-snack-bar',
          payload: {
            code: '01',
          },
        });
      }

      if (code === 'ERR_OSSL_BAD_DECRYPT') {
        e.sender.send('fromMain', {
          method: 'show-snack-bar',
          payload: {
            code: '03',
          },
        });
      }
    }
  }

  if (args.method === 'tdes-export') {
    const { payload: { key } } = args;

    const filePath = dialog.showSaveDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Exportar llave',
      defaultPath: 'llave-tdes.xml',
      filters: [
        {
          name: 'xml', extensions: ['xml'],
        },
      ],
    });

    if (filePath !== undefined) {
      const xml = parse('TDES', {
        clave: Buffer.from(key).toString('base64'),
      }, {
        declaration: {
          include: true,
          encoding: 'utf-8',
          version: '1.0',
        },
        format: {
          doublequotes: true,
          pretty: true,
        },
      });

      writeFileSync(filePath, xml);
    }
  }

  if (args.method === 'tdes-import') {
    const [filePath] = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Importar llave',
      properties: ['openFile'],
      filters: [
        {
          name: 'xml', extensions: ['xml'],
        },
      ],
    });

    if (filePath !== undefined) {
      const parser = new Parser();
      const data = readFileSync(filePath);

      parser.parseStringPromise(data).then((result) => {
        const { TDES: { clave } } = result;

        e.sender.send('fromMain', {
          method: 'result-import-tdes',
          payload: {
            key: Buffer.from(clave.toString('base64'), 'base64').toString('utf8'),
          },
        });
      });
    }
  }

  if (args.method === 'rsa-generate-keypair') {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    });

    e.sender.send('fromMain', {
      method: 'result-rsa-keypair',
      payload: {
        publicKey: publicKey.toString('base64'),
        privateKey: privateKey.toString('base64'),
      },
    });
  }

  if (args.method === 'rsa-encrypt') {
    try {
      const { payload: { publicKey, text } } = args;
      const encrypted = crypto.publicEncrypt({
        key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      }, Buffer.from(text.slice(0, 245)));

      e.sender.send('fromMain', {
        method: 'result-rsa',
        payload: encrypted.toString('base64'),
      });
    } catch ({ code }) {
      if (code === 'ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_KEY_SIZE') {
        e.sender.send('fromMain', {
          method: 'show-snack-bar',
          payload: {
            code: '02',
          },
        });
      }
    }
  }

  if (args.method === 'rsa-unencrypt') {
    try {
      const { payload: { privateKey, text } } = args;
      const unencrypted = crypto.privateDecrypt({
        modulusLength: 2048,
        key: `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      }, Buffer.from(text, 'base64'));

      e.sender.send('fromMain', {
        method: 'result-rsa',
        payload: unencrypted.toString(),
      });
    } catch ({ code }) {
      console.log(code);

      if (code === 'ERR_OSSL_RSA_DATA_LEN_NOT_EQUAL_TO_MOD_LEN') {
        e.sender.send('fromMain', {
          method: 'show-snack-bar',
          payload: {
            code: '01',
          },
        });
      }
    }
  }

  if (args.method === 'rsa-export') {
    const { payload: { publicKey: clave, privateKey: clavePrivada } } = args;
    const filePath = dialog.showSaveDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Exportar llaves',
      defaultPath: 'llaves-rsa.xml',
      filters: [
        {
          name: 'xml', extensions: ['xml'],
        },
      ],
    });

    if (filePath !== undefined) {
      const xml = parse('RSA', {
        clave,
        clavePrivada,
      }, {
        declaration: {
          include: true,
          encoding: 'utf-8',
          version: '1.0',
        },
        format: {
          doublequotes: true,
          pretty: true,
        },
      });

      writeFileSync(filePath, xml);
    }
  }

  if (args.method === 'rsa-import') {
    const [filePath] = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(e.sender), {
      title: 'Importar llaves',
      properties: ['openFile'],
      filters: [
        {
          name: 'xml', extensions: ['xml'],
        },
      ],
    });

    const parser = new Parser();
    const data = readFileSync(filePath);

    parser.parseStringPromise(data).then((result) => {
      const { RSA: { clave: publicKey, clavePrivada: privateKey } } = result;

      e.sender.send('fromMain', {
        method: 'result-import-rsa',
        payload: {
          publicKey,
          privateKey,
        },
      });
    });
  }
});
