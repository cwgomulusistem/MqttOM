const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer'dan Main'e tek yönlü iletişim
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  // Main'den Renderer'a çift yönlü iletişim
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
  // Main'den gelen mesajları dinleme
  on: (channel, func) => {
    const subscription = (event, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);

    // Cleanup fonksiyonu
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  // Kimlik bilgilerini yükleme
  loadCredentials: () => ipcRenderer.invoke('load-credentials'),
  // Kimlik bilgilerini kaydetme
  saveCredentials: (credentials) => ipcRenderer.send('save-credentials', credentials),
});
