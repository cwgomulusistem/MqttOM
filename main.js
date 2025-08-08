const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const mqtt = require('mqtt');
const fs = require('fs');

let win;
let client;
const userDataPath = app.getPath('userData');
const credentialsPath = path.join(userDataPath, 'credentials.json');
const topicsPath = path.join(userDataPath, 'topics.json'); // Topic'ler için dosya yolu

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'dist/myapp/browser/index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);
  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

// --- Dosya Sistemi Fonksiyonları ---

async function loadFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Dosya okunurken hata oluştu (${path.basename(filePath)}):`, error);
  }
  return null;
}

async function saveToFile(filePath, data) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Veri başarıyla kaydedildi: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Dosya yazılırken hata oluştu (${path.basename(filePath)}):`, error);
  }
}

// --- IPC Mantığı ---

// Kimlik Bilgileri
ipcMain.handle('load-credentials', () => loadFromFile(credentialsPath));
ipcMain.on('save-credentials', (event, credentials) => saveToFile(credentialsPath, credentials));

// Topic'ler
ipcMain.handle('load-topics', () => loadFromFile(topicsPath));
ipcMain.on('save-topics', (event, topics) => saveToFile(topicsPath, topics));


// --- MQTT ve IPC Mantığı ---

ipcMain.handle('mqtt-connect', async (event, options) => {
  const { password, ...optionsWithoutPassword } = options;
  console.log('Bağlantı isteği alındı:', optionsWithoutPassword);
  try {
    const protocol = options.protocol || 'ws';
    const brokerUrl = `${protocol}://${options.host}:${options.port}`;
    const connectOptions = { ...options, reconnectPeriod: 0, clean: true };
    client = mqtt.connect(brokerUrl, connectOptions);

    client.on('connect', () => {
      console.log("MQTT Broker'a başarıyla bağlanıldı!");
      win.webContents.send('mqtt-status', { status: 'connected' });
    });

    client.on('message', (topic, message) => {
      console.log(`[Main Process] MQTT Message Received: Topic=${topic}, Payload=${message.toString()}`); // Log eklendi
      win.webContents.send('mqtt-message', { topic, message: message.toString() });
    });

    client.on('error', (error) => {
      console.error('MQTT Hatası:', error);
      win.webContents.send('mqtt-status', { status: 'error', error: error.message });
      if (client) client.end(true);
    });

    client.on('close', () => {
      console.log('MQTT bağlantısı kapandı.');
      win.webContents.send('mqtt-status', { status: 'disconnected' });
    });

    return { success: true };
  } catch (error) {
    console.error('MQTT bağlantı hatası:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('mqtt-subscribe', (event, { topic, options }) => {
  if (client && client.connected) {
    const subOptions = options || { qos: 2 };
    client.subscribe(topic, subOptions, (err) => {
      if (err) {
        console.error(`Abone olma hatası (${topic}):`, err);
      } else {
        console.log(`Başarıyla abone olundu: ${topic} (QoS: ${subOptions.qos})`);
      }
    });
  }
});

ipcMain.on('mqtt-publish', (event, { topic, message, options }) => {
  if (client && client.connected) {
    client.publish(topic, message, options, (err) => {
      if (err) console.error(`Yayınlama hatası (${topic}):`, err);
    });
  }
});

ipcMain.on('mqtt-unsubscribe', (event, topic) => {
  if (client && client.connected && !client.disconnecting) {
    client.unsubscribe(topic, (err) => {
      if (err && !client.disconnecting) {
        console.error(`Abonelikten çıkma hatası (${topic}):`, err);
      } else {
        console.log(`Başarıyla abonelikten çıkıldı: ${topic}`);
      }
    });
  }
});

ipcMain.on('mqtt-disconnect', () => {
  if (client) {
    client.end();
  }
});
