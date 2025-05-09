// Gestion de l'onboarding pour la clé API OpenAI
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('onboarding-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('save-api-key');

  // Vérifie si la clé API est déjà enregistrée
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    modal.classList.remove('hidden');
  }

  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key.length > 0) {
      localStorage.setItem('openai_api_key', key);
      modal.classList.add('hidden');
    } else {
      apiKeyInput.style.border = '2px solid #FFD166';
      apiKeyInput.placeholder = 'Clé requise !';
    }
  });

  // Permet d'appuyer sur Entrée pour valider
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });
});

// --- Gestion de l'historique et conversion texte → audio ---
const textInput = document.getElementById('text-input');
const convertBtn = document.getElementById('convert-btn');
const audioPlayer = document.getElementById('audio-player');
const audioPlayerContainer = document.getElementById('audio-player-container');
const messageDiv = document.getElementById('message');
const historyList = document.getElementById('history-list');
const selectedTextContainer = document.getElementById('selected-text-container');
const selectedTextArea = document.getElementById('selected-text');
const progressBar = document.getElementById('progress-bar');
const podcastBtn = document.getElementById('podcast-btn');
const podcastContainer = document.getElementById('podcast-container');
const podcastAudio = document.getElementById('podcast-audio');
const podcastScript = document.getElementById('podcast-script');
const selectedTextDisplay = document.getElementById('selected-text-display');
const podcastScriptDisplay = document.getElementById('podcast-script-display');

const formElements = [textInput, convertBtn, podcastBtn];
const formZone = document.createElement('div');
formZone.id = 'form-zone';
textInput.parentNode.insertBefore(formZone, textInput);
formZone.appendChild(textInput);
formZone.appendChild(convertBtn);
formZone.appendChild(podcastBtn);
formZone.appendChild(progressBar);

const waitModal = document.getElementById('wait-modal');
const waitTitle = document.getElementById('wait-title');
const waitMessage = document.getElementById('wait-message');
const waitProgress = document.getElementById('wait-progress');

function showWaitModal(title, message) {
  waitTitle.textContent = title;
  waitMessage.textContent = message;
  waitProgress.value = 0;
  waitModal.classList.remove('hidden');
}
function updateWaitModal(message, value, max) {
  waitMessage.textContent = message;
  if (typeof value === 'number' && typeof max === 'number') {
    waitProgress.value = Math.round((value / max) * 100);
    waitProgress.max = 100;
  }
}
function hideWaitModal() {
  waitModal.classList.add('hidden');
}

// Utilisation de localStorage pour l'historique (clé: 'lectioo_history')
function getHistory() {
  return JSON.parse(localStorage.getItem('lectioo_history') || '[]');
}
function saveHistory(history) {
  localStorage.setItem('lectioo_history', JSON.stringify(history));
}

// Affichage de l'historique
function renderHistory(selectedHash = null) {
  const history = getHistory();
  historyList.innerHTML = '';
  if (history.length === 0) {
    historyList.innerHTML = '<li style="opacity:.7">Aucune conversion</li>';
    return;
  }
  // Séparer conversions et podcasts
  const conversions = history.filter(item => !item.type || item.type === undefined);
  const podcasts = history.filter(item => item.type === 'podcast');
  if (conversions.length) {
    const convTitle = document.createElement('div');
    convTitle.className = 'history-section-title';
    convTitle.textContent = 'Conversions';
    historyList.appendChild(convTitle);
    conversions.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item' + (selectedHash === item.hash ? ' selected' : '');
      const date = item.date ? new Date(item.date) : new Date();
      li.innerHTML = `
        <div class="history-label-block">
          <span class="history-label" title="${item.text.replace(/\n/g, ' ')}">📄 ${item.text.slice(0, 18)}…</span>
          <div class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        <div class="history-actions">
          <button data-hash="${item.hash}" class="play-btn play-svg-btn" title="Écouter"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="11" fill="#A8E6CF"/><polygon points="8,6 16,11 8,16" fill="#3A506B"/></svg></button>
          <button data-hash="${item.hash}" class="delete-btn" title="Supprimer"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="8" width="2" height="6" fill="#3A506B"/><rect x="9" y="8" width="2" height="6" fill="#3A506B"/><rect x="13" y="8" width="2" height="6" fill="#3A506B"/><rect x="4" y="6" width="12" height="2" fill="#A8E6CF"/><rect x="7" y="2" width="6" height="2" fill="#3A506B"/></svg></button>
        </div>`;
      historyList.appendChild(li);
    });
  }
  if (podcasts.length) {
    const podTitle = document.createElement('div');
    podTitle.className = 'history-section-title';
    podTitle.textContent = 'Podcasts';
    historyList.appendChild(podTitle);
    podcasts.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item' + (selectedHash === item.hash ? ' selected' : '');
      const date = item.date ? new Date(item.date) : new Date();
      li.innerHTML = `
        <div class="history-label-block">
          <span class="history-label" title="${item.text.replace(/\n/g, ' ')}">🎙️ ${item.text.slice(0, 18)}… <span class="badge-podcast">Podcast</span></span>
          <div class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        <div class="history-actions">
          <button data-hash="${item.hash}" class="play-podcast play-svg-btn" title="Écouter"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="11" fill="#A8E6CF"/><polygon points="8,6 16,11 8,16" fill="#3A506B"/></svg></button>
          <button data-hash="${item.hash}" class="delete-btn" title="Supprimer"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="8" width="2" height="6" fill="#3A506B"/><rect x="9" y="8" width="2" height="6" fill="#3A506B"/><rect x="13" y="8" width="2" height="6" fill="#3A506B"/><rect x="4" y="6" width="12" height="2" fill="#A8E6CF"/><rect x="7" y="2" width="6" height="2" fill="#3A506B"/></svg></button>
        </div>`;
      historyList.appendChild(li);
    });
  }
}

function showLecture({icon, type, title, date, audio, text, hash}) {
  document.getElementById('lecture-icon').textContent = icon;
  document.getElementById('lecture-type').textContent = type;
  document.getElementById('lecture-title').textContent = title;
  document.getElementById('lecture-date').textContent = date ? new Date(date).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) : '';
  document.getElementById('lecture-audio').src = audio;
  document.getElementById('lecture-text').textContent = text;
  document.getElementById('lecture-container').classList.remove('hidden');
  // Highlight dans l'historique
  renderHistory(hash);
}
function hideLecture() {
  document.getElementById('lecture-container').classList.add('hidden');
  renderHistory();
}

// Hash SHA-256 (Web Crypto API)
async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Conversion texte → audio (via preload)
async function convertTextToAudio(text, apiKey) {
  // Appel réel via preload (IPC)
  return await window.lectiooAPI.convertTextToAudio(text, apiKey);
}

// Gestion du bouton de conversion
convertBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) {
    messageDiv.textContent = 'Merci de coller un texte à convertir.';
    return;
  }
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    messageDiv.textContent = 'Clé API manquante.';
    return;
  }
  convertBtn.disabled = true;
  convertBtn.textContent = 'Génération en cours…';
  progressBar.classList.remove('hidden');
  progressBar.value = 0;
  messageDiv.textContent = 'Préparation de la conversion…';
  const hash = await hashText(text);
  let history = getHistory();
  let entry = history.find(e => e.hash === hash);
  if (entry) {
    showLecture({
      icon: '📄',
      type: 'Texte',
      title: entry.text.slice(0, 40) + (entry.text.length > 40 ? '…' : ''),
      date: entry.date,
      audio: entry.audio,
      text: entry.text,
      hash: entry.hash
    });
    hideForm();
  } else {
    try {
      showWaitModal('Génération de l\'audio', 'Préparation de la conversion…');
      // Gestion de la progression via callback
      let lastProgress = 0;
      window.lectiooAPI.onProgress && window.lectiooAPI.onProgress((current, total) => {
        updateWaitModal(total > 1 ? `Conversion du texte… (${current}/${total})` : 'Conversion en cours…', current, total);
      });
      const audioPath = await window.lectiooAPI.convertTextToAudio(text, apiKey);
      entry = { text, hash, audio: audioPath, date: new Date().toISOString() };
      history.unshift(entry);
      saveHistory(history);
      renderHistory();
      showLecture({
        icon: '📄',
        type: 'Texte',
        title: text.slice(0, 40) + (text.length > 40 ? '…' : ''),
        date: entry.date,
        audio: audioPath,
        text: text,
        hash: entry.hash
      });
      hideForm();
    } catch (e) {
      messageDiv.textContent = 'Erreur lors de la conversion.';
    } finally {
      progressBar.classList.add('hidden');
      convertBtn.disabled = false;
      convertBtn.textContent = 'Générer l\'audio';
      hideWaitModal();
    }
  }
});

// Lecture depuis l'historique
historyList.addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    const hash = deleteBtn.getAttribute('data-hash');
    let history = getHistory();
    const entry = history.find(e => e.hash === hash);
    if (entry) {
      // Supprimer le fichier audio associé (via preload)
      if (entry.audio) {
        await window.lectiooAPI.deleteFile && window.lectiooAPI.deleteFile(entry.audio);
      }
      // Supprimer le fichier texte du podcast si besoin
      if (entry.type === 'podcast' && entry.scriptPath) {
        await window.lectiooAPI.deleteFile && window.lectiooAPI.deleteFile(entry.scriptPath);
      }
      // Supprimer de l'historique
      history = history.filter(e => e.hash !== hash);
      saveHistory(history);
      renderHistory();
      hideLecture();
    }
    return;
  }
  const playBtn = e.target.closest('.play-btn');
  const playPodcastBtn = e.target.closest('.play-podcast');
  if (playBtn) {
    const hash = playBtn.getAttribute('data-hash');
    const entry = getHistory().find(e => e.hash === hash && (!e.type || e.type === undefined));
    if (entry) {
      showLecture({
        icon: '📄',
        type: 'Texte',
        title: entry.text.slice(0, 40) + (entry.text.length > 40 ? '…' : ''),
        date: entry.date,
        audio: entry.audio,
        text: entry.text,
        hash: entry.hash
      });
      hideForm();
    }
  } else if (playPodcastBtn) {
    const hash = playPodcastBtn.getAttribute('data-hash');
    const entry = getHistory().find(e => e.hash === hash && e.type === 'podcast');
    if (entry) {
      showLecture({
        icon: '🎙️',
        type: 'Podcast de révisions',
        title: 'Podcast de révisions',
        date: entry.date,
        audio: entry.audio,
        text: entry.script,
        hash: entry.hash
      });
      hideForm();
    }
  }
});

// Initialisation
renderHistory();

// Gestion du bouton podcast
podcastBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) {
    messageDiv.textContent = 'Merci de coller un texte à convertir.';
    return;
  }
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    messageDiv.textContent = 'Clé API manquante.';
    return;
  }
  podcastBtn.disabled = true;
  podcastBtn.textContent = 'Génération du podcast…';
  const hash = await hashText('podcast:' + text);
  let history = getHistory();
  let entry = history.find(e => e.hash === hash && e.type === 'podcast');
  if (entry) {
    showLecture({
      icon: '🎙️',
      type: 'Podcast de révisions',
      title: 'Podcast de révisions',
      date: entry.date,
      audio: entry.audio,
      text: entry.script,
      hash: entry.hash
    });
    hideForm();
    podcastBtn.disabled = false;
    podcastBtn.textContent = 'Générer un podcast de révisions';
    hideWaitModal();
  } else {
    showWaitModal('Génération du podcast', 'Génération du script de podcast…');
    try {
      window.lectiooAPI.onPodcastProgress && window.lectiooAPI.onPodcastProgress((current, total) => {
        updateWaitModal(total > 1 ? `Génération de l'audio du podcast… (${current}/${total})` : 'Génération de l\'audio du podcast…', current, total);
      });
      const result = await window.lectiooAPI.generatePodcast(text, apiKey);
      entry = { text, hash, audio: result.audioPath, script: result.script, type: 'podcast', date: new Date().toISOString() };
      history.unshift(entry);
      saveHistory(history);
      renderHistory();
      showLecture({
        icon: '🎙️',
        type: 'Podcast de révisions',
        title: 'Podcast de révisions',
        date: entry.date,
        audio: result.audioPath,
        text: result.script,
        hash: entry.hash
      });
      hideForm();
    } catch (e) {
      messageDiv.textContent = 'Erreur lors de la génération du podcast.';
    } finally {
      podcastBtn.disabled = false;
      podcastBtn.textContent = 'Générer un podcast de révisions';
      hideWaitModal();
    }
  }
});

const newTextBtn = document.getElementById('new-text-btn');
newTextBtn.addEventListener('click', () => {
  // Réinitialiser l'UI
  textInput.value = '';
  hideLecture();
  formZone.style.display = '';
  messageDiv.textContent = '';
  textInput.focus();
});

function hideForm() {
  formZone.style.display = 'none';
}
function showForm() {
  formZone.style.display = '';
}
