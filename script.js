const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volume');
const tituloEl = document.getElementById('titulo');
const artistaEl = document.getElementById('artista');
const visualizerEl = document.getElementById('visualizer');

let playlist = [];
let currentIndex = 0;
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;

function initVisualizer() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    visualizerEl.innerHTML = '';
    for (let i = 0; i < bufferLength; i++) {
      const bar = document.createElement('div');
      visualizerEl.appendChild(bar);
    }
  }
}

function animateVisualizer() {
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  const bars = visualizerEl.children;
  const time = Date.now() * 0.001;

  for (let i = 0; i < bars.length; i++) {
    const value = dataArray[i] || 0;
    const height = Math.max(2, value / 2.5);
    bars[i].style.height = `${height}px`;
    const hue = 200 + (time * 10 + i * 5) % 60;
    bars[i].style.background = `hsl(${hue}, 80%, 65%)`;
  }
  animationId = requestAnimationFrame(animateVisualizer);
}

// Cargar playlist y primera canción
fetch('playlist.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.canciones.slice(0, 20);
    if (playlist.length > 0) {
      loadAndPlay(playlist[0], 0);
    } else {
      tituloEl.textContent = "No hay canciones";
    }
  })
  .catch(err => {
    tituloEl.textContent = "❌ Error al cargar música";
    console.error(err);
  });

function loadAndPlay(cancion, index) {
  tituloEl.textContent = cancion.titulo;
  artistaEl.textContent = cancion.artista;
  audioPlayer.src = cancion.archivo;
  currentIndex = index;

  audioPlayer.play()
    .then(() => {
      playBtn.textContent = '⏸';
      initVisualizer();
      if (audioContext?.state === 'suspended') audioContext.resume();
      animateVisualizer();
    })
    .catch(e => {
      console.warn('Reproducción bloqueada:', e);
      playBtn.textContent = '▶';
    });
}

playBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      playBtn.textContent = '⏸';
      if (audioContext && audioContext.state === 'suspended') audioContext.resume();
      if (!animationId) animateVisualizer();
    });
  } else {
    audioPlayer.pause();
    playBtn.textContent = '▶';
    cancelAnimationFrame(animationId);
    animationId = null;
  }
});

function nextSong() {
  if (playlist.length <= 1) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadAndPlay(playlist[currentIndex], currentIndex);
}

function prevSong() {
  if (playlist.length <= 1) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadAndPlay(playlist[currentIndex], currentIndex);
}

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audioPlayer.addEventListener('ended', nextSong);

// Progreso y volumen
audioPlayer.addEventListener('timeupdate', () => {
  progress.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
});

progress.addEventListener('input', () => {
  audioPlayer.currentTime = (progress.value / 100) * audioPlayer.duration || 0;
});

volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = volumeSlider.value;
});