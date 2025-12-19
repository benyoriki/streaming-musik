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
const videoStage = document.getElementById("videoStage");
const bgVideo = document.getElementById("bgVideo");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs=[], filteredSongs=[];
let currentIndex=0, isPlaying=false, currentGenre="All";

/* LOAD SONGS */
fetch("music-list.json")
.then(r=>r.json())
.then(d=>{
  songs=d;
  initGenres();
  applyFilter();
});

/* GENRE */
function initGenres(){
  const genres=["All",...new Set(songs.map(s=>s.genre))];
  genreBar.innerHTML="";
  genres.forEach(g=>{
    const div=document.createElement("div");
    div.className="genre"+(g==="All"?" active":"");
    div.textContent=g;
    div.onclick=()=>{
      document.querySelectorAll(".genre").forEach(x=>x.classList.remove("active"));
      div.classList.add("active");
      currentGenre=g;
      applyFilter();
    };
    genreBar.appendChild(div);
  });
}

/* FILTER */
function applyFilter(){
  const q=searchInput.value.toLowerCase();
  filteredSongs=songs.filter(s=>
    (currentGenre==="All"||s.genre===currentGenre)&&
    s.title.toLowerCase().includes(q)
  );
  renderPlaylist();
}

/* PLAYLIST */
function renderPlaylist(){
  playlistEl.innerHTML="";
  filteredSongs.forEach((s,i)=>{
    const li=document.createElement("li");
    li.textContent=s.title;
    li.onclick=()=>playSong(i);
    playlistEl.appendChild(li);
  });
}

/* PLAY */
function playSong(i){
  const s=filteredSongs[i];
  if(!s)return;
  currentIndex=i;
  audio.src=s.url;
  titleEl.textContent=s.title;
  artistEl.textContent=s.artist;
  audio.play();
  bgVideo.play();
  isPlaying=true;
  playBtn.textContent="⏸";
  videoStage.classList.add("playing");

  document.querySelectorAll(".playlist li").forEach(li=>li.classList.remove("active"));
  playlistEl.children[i].classList.add("active");
}

/* CONTROLS */
playBtn.onclick=()=>{
  if(!audio.src)return;
  if(isPlaying){
    audio.pause();
    bgVideo.pause();
    playBtn.textContent="▶";
    videoStage.classList.remove("playing");
  }else{
    audio.play();
    bgVideo.play();
    playBtn.textContent="⏸";
    videoStage.classList.add("playing");
  }
  isPlaying=!isPlaying;
};

nextBtn.onclick=()=>playSong((currentIndex+1)%filteredSongs.length);
prevBtn.onclick=()=>playSong((currentIndex-1+filteredSongs.length)%filteredSongs.length);

audio.addEventListener("ended",()=>{
  bgVideo.pause();
  bgVideo.currentTime=0;
  videoStage.classList.remove("playing");
});

/* SEEK */
audio.addEventListener("loadedmetadata",()=>progress.max=audio.duration);
audio.addEventListener("timeupdate",()=>{
  if(!progress.dragging)progress.value=audio.currentTime;
});
progress.addEventListener("mousedown",()=>progress.dragging=true);
progress.addEventListener("mouseup",()=>{
  progress.dragging=false;
  audio.currentTime=progress.value;
});

/* VOLUME */
volume.oninput=()=>audio.volume=volume.value;

/* SEARCH */
searchInput.oninput=applyFilter;

/* VISUALIZER */
const AudioContext=window.AudioContext||window.webkitAudioContext;
const audioCtx=new AudioContext();
const src=audioCtx.createMediaElementSource(audio);
const analyser=audioCtx.createAnalyser();
src.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize=64;

document.body.addEventListener("click",()=>{
  if(audioCtx.state==="suspended")audioCtx.resume();
},{once:true});

function resize(){
  canvas.width=window.innerWidth;
  canvas.height=50;
}
window.addEventListener("resize",resize);
resize();
/* =========================
   STARFIELD (SPACE EFFECT)
   ========================= */
const starCanvas = document.getElementById("stars");
const sctx = starCanvas.getContext("2d");

function resizeStars(){
  starCanvas.width = 300;
  starCanvas.height = 300;
}
resizeStars();

const stars = Array.from({length:80},()=>({
  x:Math.random()*300,
  y:Math.random()*300,
  r:Math.random()*1.5,
  v:Math.random()*0.3 + 0.1
}));

function drawStars(){
  requestAnimationFrame(drawStars);
  sctx.clearRect(0,0,300,300);
  stars.forEach(s=>{
    s.y += s.v;
    if(s.y > 300) s.y = 0;

    sctx.fillStyle = "#00ff66";
    sctx.beginPath();
    sctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    sctx.fill();
  });
}
drawStars();


const data=new Uint8Array(analyser.frequencyBinCount);
(function draw(){
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(data);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const w=canvas.width/data.length;
  data.forEach((v,i)=>{
    ctx.fillStyle="#00ff66";
    ctx.fillRect(i*w,canvas.height-v/2,w-2,v/2);
  });
})();
