const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Utiliser le dossier userData pour stocker les fichiers audio
const userDataPath = app.getPath('userData');
const audioDir = path.join(userDataPath, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Fonction utilitaire pour générer un nom de fichier unique
function getAudioFilePath(hash) {
  return path.join(audioDir, `audio_${hash}.mp3`);
}

// Fonction pour découper le texte sans couper au milieu d'une phrase
function splitTextSmart(text, maxLen = 4096) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Handler IPC pour la conversion texte → audio
ipcMain.handle('convert-text-to-audio', async (event, text, apiKey) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const audioPath = getAudioFilePath(hash);
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }

  // Découpage du texte
  const chunks = splitTextSmart(text, 4096);
  const tempFiles = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const tempPath = path.join(audioDir, `temp_${hash}_${i}.mp3`);
    // Envoi de la progression au renderer
    event.sender.send('tts-progress', i + 1, chunks.length);
    await new Promise((resolve, reject) => {
      const url = 'https://api.openai.com/v1/audio/speech';
      const body = JSON.stringify({
        model: 'tts-1',
        input: chunk,
        voice: 'alloy',
        response_format: 'mp3'
      });
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      const req = https.request(url, options, (res) => {
        if (res.statusCode !== 200) {
          let error = '';
          res.on('data', chunk => error += chunk);
          res.on('end', () => reject(error));
          return;
        }
        const fileStream = fs.createWriteStream(tempPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    tempFiles.push(tempPath);
  }

  // Assemblage des fichiers MP3 (concaténation binaire)
  const finalStream = fs.createWriteStream(audioPath);
  for (const tempFile of tempFiles) {
    const data = fs.readFileSync(tempFile);
    finalStream.write(data);
    fs.unlinkSync(tempFile);
  }
  finalStream.end();

  return audioPath;
});

// Handler IPC pour générer un podcast de révisions
ipcMain.handle('generate-podcast', async (event, text, apiKey) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update('podcast:' + text).digest('hex');
  const audioPath = path.join(audioDir, `podcast_${hash}.mp3`);
  const scriptPath = path.join(audioDir, `podcast_${hash}.txt`);
  if (fs.existsSync(audioPath) && fs.existsSync(scriptPath)) {
    return { audioPath, script: fs.readFileSync(scriptPath, 'utf-8') };
  }

  // 1. Générer le script avec GPT-4.1
  const prompt = `Tu es un professeur de collège. À partir du texte suivant, génère uniquement le texte à lire pour un podcast de révisions d'environ 2 à 3 minutes : commence par un résumé, puis liste les points clés à retenir, donne un conseil de révision, et termine par une ou deux questions pour s'auto-tester. Utilise un ton sympathique et motivant. Ne donne que le texte à lire, sans explication, sans balises, sans introduction. Voici le texte :\n\n${text}`;
  const gptBody = JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Tu es un professeur de collège.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 700,
    temperature: 0.7
  });
  const gptOptions = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  const gptRes = await new Promise((resolve, reject) => {
    const req = https.request('https://api.openai.com/v1/chat/completions', gptOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(data);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(gptBody);
    req.end();
  });
  const gptJson = JSON.parse(gptRes);
  const script = gptJson.choices[0].message.content.trim();
  fs.writeFileSync(scriptPath, script, 'utf-8');

  // 2. Générer l'audio du script (TTS)
  const chunks = splitTextSmart(script, 4096);
  const tempFiles = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const tempPath = path.join(audioDir, `temp_podcast_${hash}_${i}.mp3`);
    event.sender.send('podcast-progress', i + 1, chunks.length);
    await new Promise((resolve, reject) => {
      const url = 'https://api.openai.com/v1/audio/speech';
      const body = JSON.stringify({
        model: 'tts-1',
        input: chunk,
        voice: 'alloy',
        response_format: 'mp3'
      });
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      const req = https.request(url, options, (res) => {
        if (res.statusCode !== 200) {
          let error = '';
          res.on('data', chunk => error += chunk);
          res.on('end', () => reject(error));
          return;
        }
        const fileStream = fs.createWriteStream(tempPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    tempFiles.push(tempPath);
  }
  const finalStream = fs.createWriteStream(audioPath);
  for (const tempFile of tempFiles) {
    const data = fs.readFileSync(tempFile);
    finalStream.write(data);
    fs.unlinkSync(tempFile);
  }
  finalStream.end();

  return { audioPath, script };
});

// Handler IPC pour supprimer un fichier
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
});
