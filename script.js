// Basic paste-and-play. Detects YouTube, Vimeo, or direct video file links.
// Minimal sanitization: disallow javascript: scheme and require http/https.
const input = document.getElementById('urlInput');
const loadBtn = document.getElementById('loadBtn');
const player = document.getElementById('player');
const message = document.getElementById('message');

function showMessage(txt, isError = true){
  message.textContent = txt;
  message.style.color = isError ? '#ffb4b4' : '#baf7ff';
}

function clearPlayer(){
  player.innerHTML = '';
}

function isLikelyDirectVideo(url){
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function getYouTubeId(url){
  // handles youtu.be/ID, watch?v=ID, embed/ID
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')){
      return u.pathname.slice(1);
    }
    if(u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')){
      if(u.searchParams.get('v')) return u.searchParams.get('v');
      const path = u.pathname.split('/');
      const idx = path.indexOf('embed');
      if(idx >= 0 && path[idx+1]) return path[idx+1];
    }
  }catch(e){}
  return null;
}

function getVimeoId(url){
  // crude: vimeo.com/ID or player.vimeo.com/video/ID
  try{
    const u = new URL(url);
    if(u.hostname.includes('vimeo.com')){
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[parts.length-1];
    }
  }catch(e){}
  return null;
}

function safeUrl(s){
  try{
    const u = new URL(s);
    if(!['http:','https:'].includes(u.protocol)) return null;
    return u.toString();
  }catch(e){
    return null;
  }
}

function loadFromUrl(raw){
  clearPlayer();
  message.textContent = '';
  const url = safeUrl(raw);
  if(!url){
    showMessage('That doesn\'t look like a safe http(s) URL.');
    return;
  }

  // YouTube
  const yt = getYouTubeId(url);
  if(yt){
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allowfullscreen','');
    iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(yt)}?rel=0`;
    player.appendChild(iframe);
    showMessage('', false);
    return;
  }

  // Vimeo
  const vm = getVimeoId(url);
  if(vm){
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allowfullscreen','');
    iframe.setAttribute('allow','autoplay; fullscreen; picture-in-picture');
    iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(vm)}`;
    player.appendChild(iframe);
    showMessage('', false);
    return;
  }

  // Direct video file
  if(isLikelyDirectVideo(url)){
    const vid = document.createElement('video');
    vid.controls = true;
    vid.src = url;
    vid.crossOrigin = 'anonymous';
    vid.onerror = () => showMessage('Could not load the video file. It may block cross-origin requests or be an unsupported format.');
    player.appendChild(vid);
    showMessage('', false);
    return;
  }

  // Unknown — attempt to embed as iframe if same origin or likely embeddable
  const iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen','');
  iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');
  iframe.src = url;
  iframe.onerror = () => showMessage('Embedding failed — the site may disallow embedding (X-Frame-Options) or block cross-origin requests.');
  player.appendChild(iframe);
  showMessage('Loaded via iframe (may be blocked by some sites).', false);
}

// event handlers
loadBtn.addEventListener('click', () => loadFromUrl(input.value.trim()));
input.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') loadFromUrl(input.value.trim());
});

// support pasting: if user pastes a URL, focus load automatically (nice UX)
input.addEventListener('paste', (e) => {
  setTimeout(() => {
    const val = input.value.trim();
    if(val) loadFromUrl(val);
  }, 50);
});
