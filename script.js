const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const searchInput = document.getElementById("search");
const genreBar = document.getElementById("genreBar");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let filteredSongs = [];
let currentIndex = 0;
let isPlaying = false;
let currentGenre = "All";

/* LOAD SONG */
fetch("music-list.json")
.then(r => r.json())
.then(d => {
  songs = d;
  initGenres();
  applyFilter();
});

/* GENRE */
function initGenres(){
  const genres = ["All", ...new Set(songs.map(s => s.genre))];
  genreBar.innerHTML = "";
  genres.forEach(g => {
    const div = document.createElement("div");
    div.className = "genre" + (g === "All" ? " active" : "");
    div.textContent = g;
    div.onclick = () => {
      document.querySelectorAll(".genre").forEach(x => x.classList.remove("active"));
      div.classList.add("active");
      currentGenre = g;
      applyFilter();
    };
    genreBar.appendChild(div);
  });
}

/* FILTER */
function applyFilter(){
  const q = searchInput.value.toLowerCase();
  filteredSongs = songs.filter(s =>
    (currentGenre === "All" || s.genre === currentGenre) &&
    s.title.toLowerCase().includes(q)
  );
  renderPlaylist();
}

/* PLAYLIST */
function renderPlaylist(){
  playlistEl.innerHTML = "";
  filteredSongs.forEach((s,i)=>{
    const li = document.createElement("li");
    li.textContent = s.title;
    li.onclick = () => playSong(i);
    playlistEl.appendChild(li);
  });
}

/* PLAY SONG */
function playSong(i){
  const s = filteredSongs[i];
  if(!s) return;

  currentIndex = i;
  audio.src = s.url;
  titleEl.textContent = s.title;
  artistEl.textContent = s.artist;

  playAudio();

  document.querySelectorAll(".playlist li").forEach(li=>li.classList.remove("active"));
  playlistEl.children[i].classList.add("active");
}

/* PLAY / PAUSE */
function playAudio(){
  audio.play();
  isPlaying = true;
  playBtn.textContent = "⏸";
  document.querySelector(".app").classList.add("playing");
}

function pauseAudio(){
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶";
  document.querySelector(".app").classList.remove("playing");
}

/* CONTROLS */
playBtn.onclick = () => {
  if(!audio.src) return;
  isPlaying ? pauseAudio() : playAudio();
};

nextBtn.onclick = () =>
  playSong((currentIndex + 1) % filteredSongs.length);

prevBtn.onclick = () =>
  playSong((currentIndex - 1 + filteredSongs.length) % filteredSongs.length);

/* STOP WHEN END */
audio.addEventListener("ended", pauseAudio);

/* SEEK */
audio.addEventListener("loadedmetadata", ()=>progress.max = audio.duration);
audio.addEventListener("timeupdate", ()=>progress.value = audio.currentTime);
progress.oninput = ()=>audio.currentTime = progress.value;

/* VOLUME */
volume.oninput = ()=>audio.volume = volume.value;

/* SEARCH */
searchInput.oninput = applyFilter;

/* VISUALIZER */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const src = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

src.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 64;

document.body.addEventListener("click",()=>{
  if(audioCtx.state === "suspended") audioCtx.resume();
},{once:true});

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = 50;
}
window.addEventListener("resize", resize);
resize();

const data = new Uint8Array(analyser.frequencyBinCount);
(function draw(){
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(data);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const w = canvas.width / data.length;
  data.forEach((v,i)=>{
    ctx.fillStyle = "#00ff66";
    ctx.fillRect(i*w, canvas.height - v/2, w-2, v/2);
  });
})();

/* =========================
   CLOCK & DATE (WITH SECONDS)
   ========================= */
const topbar = document.querySelector(".topbar");
if(topbar){
  const clockEl = document.createElement("div");
  clockEl.className = "clock-date";
  topbar.appendChild(clockEl);

  function updateClock(){
    const now = new Date();

    const jam    = String(now.getHours()).padStart(2,"0");
    const menit = String(now.getMinutes()).padStart(2,"0");
    const detik = String(now.getSeconds()).padStart(2,"0");

    const hariNama = [
      "Minggu","Senin","Selasa",
      "Rabu","Kamis","Jumat","Sabtu"
    ];

    const hari = hariNama[now.getDay()];
    const tgl  = String(now.getDate()).padStart(2,"0");
    const bln  = String(now.getMonth()+1).padStart(2,"0");
    const thn  = now.getFullYear();

    clockEl.textContent =
      `${jam}:${menit}:${detik} ${hari} ${tgl}/${bln}/${thn}`;
  }

  updateClock();
  setInterval(updateClock,1000);
}
