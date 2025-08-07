const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const mqtt = require('mqtt');
const fs = require('fs'); // fs modülünü ekle

let win;
let client;
const credentialsPath = path.join(app.getPath('userData'), 'credentials.json'); // Kimlik bilgileri dosya yolu

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload betiğini ekleyin
      nodeIntegration: false, // güvenlik için false olmalı
      contextIsolation: true, // güvenlik için true olmalı
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    // --- BU SATIRIN DOĞRU OLDUĞUNDAN EMİN OLUN ---
    pathname: path.join(__dirname, 'dist/myapp/browser/index.html'), 
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);

  win.webContents.openDevTools(); // Hata ayıklama için açık kalsın

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', () => {
  createWindow();
  // Uygulama hazır olduğunda kimlik bilgilerini yükle ve Angular'a gönder
  loadCredentials().then(credentials => {
    if (credentials && win) {
      win.webContents.send('load-credentials-success', credentials);
    }
  });
});

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

// Kimlik bilgilerini yükleme fonksiyonu
async function loadCredentials() {
  try {
    if (fs.existsSync(credentialsPath)) {
      const data = await fs.promises.readFile(credentialsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Kimlik bilgileri yüklenirken hata oluştu:', error);
  }
  return null;
}

// Kimlik bilgilerini kaydetme fonksiyonu
async function saveCredentials(credentials) {
  try {
    await fs.promises.writeFile(credentialsPath, JSON.stringify(credentials), 'utf8');
    console.log('Kimlik bilgileri başarıyla kaydedildi.');
  } catch (error) {
    console.error('Kimlik bilgileri kaydedilirken hata oluştu:', error);
  }
}

// --- IPC Mantığı ---

// Kimlik bilgilerini yükleme isteği
ipcMain.handle('load-credentials', async () => {
  return await loadCredentials();
});

// Kimlik bilgilerini kaydetme isteği
ipcMain.on('save-credentials', (event, credentials) => {
  saveCredentials(credentials);
});

// --- MQTT ve IPC Mantığı ---

// MQTT Broker'a bağlanma isteği
ipcMain.handle('mqtt-connect', async (event, options) => {
  const { password, ...optionsWithoutPassword } = options; // Şifreyi loglamadan çıkar
  console.log('Bağlantı isteği alındı:', optionsWithoutPassword);
  try {
    const protocol = options.protocol || 'ws';
    const brokerUrl = `${protocol}://${options.host}:${options.port}`;
    // Otomatik yeniden bağlanmayı devre dışı bırak
    const connectOptions = {
      ...options,
      reconnectPeriod: 0, 
      clean: true
    };
    client = mqtt.connect(brokerUrl, connectOptions);

    client.on('connect', () => {
      console.log("MQTT Broker'a başarıyla bağlanıldı!");
      console.log("'mqtt-status: connected' mesajı Angular'a gönderiliyor...");
      win.webContents.send('mqtt-status', { status: 'connected' });
    });

    client.on('message', (topic, message) => {
      // Gelen mesajı Angular tarafına gönder
      win.webContents.send('mqtt-message', { topic, message: message.toString() });
    });

    client.on('error', (error) => {
      console.error('MQTT Hatası:', error);
      win.webContents.send('mqtt-status', { status: 'error', error: error.message });
      if (client) {
        client.end(true); // Hata durumunda bağlantıyı zorla kapat
      }
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

// Topic'e abone olma isteği
ipcMain.on('mqtt-subscribe', (event, { topic, options }) => {
  if (client && client.connected) {
    client.subscribe(topic, options, (err) => {
      if (err) {
        console.error(`Abone olma hatası (${topic}):`, err);
      } else {
        console.log(`Başarıyla abone olundu: ${topic} (QoS: ${options.qos})`);
      }
    });
  }
});

// Mesaj yayınlama isteği
ipcMain.on('mqtt-publish', (event, { topic, message, options }) => {
  if (client && client.connected) {
    client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`Yayınlama hatası (${topic}):`, err);
      }
    });
  }
});

// Topic'ten aboneliği kaldırma isteği
ipcMain.on('mqtt-unsubscribe', (event, topic) => {
  if (client && client.connected) {
    client.unsubscribe(topic, (err) => {
      if (err) {
        console.error(`Abonelikten çıkma hatası (${topic}):`, err);
      } else {
        console.log(`Başarıyla abonelikten çıkıldı: ${topic}`);
      }
    });
  }
});

// Bağlantıyı kesme isteği
ipcMain.on('mqtt-disconnect', () => {
  if (client) {
    client.end();
  }
});