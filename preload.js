const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lectiooAPI', {
  convertTextToAudio: (text, apiKey) => ipcRenderer.invoke('convert-text-to-audio', text, apiKey),
  onProgress: (callback) => ipcRenderer.on('tts-progress', (event, current, total) => callback(current, total)),
  generatePodcast: (text, apiKey) => ipcRenderer.invoke('generate-podcast', text, apiKey),
  onPodcastProgress: (callback) => ipcRenderer.on('podcast-progress', (event, current, total) => callback(current, total)),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath)
});
