const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const mqtt = require('mqtt');
const fs = require('fs');

let win;
let client;
// Configuration file paths
const credentialsPath = path.join(app.getPath('userData'), 'credentials.json');
const configPath = path.join(app.getPath('userData'), 'config.json');


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

// --- General Config Management ---

/**
 * Reads the entire configuration file.
 * @returns {object} The parsed configuration object or an empty object.
 */
async function readConfigFile() {
  try {
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, 'utf8');
      return JSON.parse(data) || {};
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return {};
}

/**
 * Writes an object to the configuration file.
 * @param {object} configData The data to write.
 */
async function writeConfigFile(configData) {
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf8');
  } catch (error)
 {
    console.error('Error writing config file:', error);
  }
}

// IPC handler to load a specific key from the config
ipcMain.handle('load-config', async (event, key) => {
  const config = await readConfigFile();
  return config[key];
});

// IPC handler to save data for a specific key in the config
ipcMain.on('save-config', async (event, { key, data }) => {
  const config = await readConfigFile();
  config[key] = data;
  await writeConfigFile(config);
});


// --- Credentials Management (Legacy Support) ---

ipcMain.handle('load-credentials', async () => {
  try {
    if (fs.existsSync(credentialsPath)) {
      const data = await fs.promises.readFile(credentialsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
  return null;
});

ipcMain.on('save-credentials', async (event, credentials) => {
  try {
    await fs.promises.writeFile(credentialsPath, JSON.stringify(credentials), 'utf8');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
});


// --- MQTT and IPC Logic ---

ipcMain.handle('mqtt-connect', async (event, options) => {
  console.log('Connection request received:', { ...options, password: '***' });
  try {
    const protocol = options.protocol || 'ws';
    const brokerUrl = `${protocol}://${options.host}:${options.port}`;
    const connectOptions = { ...options, reconnectPeriod: 0, clean: true };
    client = mqtt.connect(brokerUrl, connectOptions);

    client.on('connect', () => {
      console.log('Successfully connected to MQTT Broker.');
      win.webContents.send('mqtt-status', { status: 'connected' });
    });

    client.on('message', (topic, message) => {
      win.webContents.send('mqtt-message', { topic, message: message.toString() });
    });

    client.on('error', (error) => {
      console.error('MQTT Error:', error.message);
      win.webContents.send('mqtt-status', { status: 'error', error: error.message });
      if (client) client.end(true);
    });

    client.on('close', () => {
      console.log('MQTT connection closed.');
      win.webContents.send('mqtt-status', { status: 'disconnected' });
    });

    return { success: true };
  } catch (error) {
    console.error('MQTT connection setup error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('mqtt-subscribe', (event, { topic, options }) => {
  if (client && client.connected) {
    client.subscribe(topic, options, (err) => {
      if (err) console.error(`Subscription error (${topic}):`, err);
      else console.log(`Subscribed to: ${topic}`);
    });
  }
});

ipcMain.on('mqtt-publish', (event, { topic, message, options }) => {
  if (client && client.connected) {
    client.publish(topic, message, options, (err) => {
      if (err) console.error(`Publish error (${topic}):`, err);
    });
  }
});

ipcMain.on('mqtt-unsubscribe', (event, topic) => {
  if (client && client.connected) {
    client.unsubscribe(topic, (err) => {
      if (err) console.error(`Unsubscribe error (${topic}):`, err);
      else console.log(`Unsubscribed from: ${topic}`);
    });
  }
});

ipcMain.on('mqtt-disconnect', () => {
  if (client) {
    client.end();
  }
});
