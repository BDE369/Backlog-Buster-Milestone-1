(function(){
const STORAGE_GAMES = "bb_games";
const RAWG_KEY = "473f72f245944c0ca5adcd8e202d98d9";   // <-- Insert your free RAWG API key

function $(sel){ return document.querySelector(sel); }
function loadGames(){ return JSON.parse(localStorage.getItem(STORAGE_GAMES) || "[]"); }
function saveGames(arr){ localStorage.setItem(STORAGE_GAMES, JSON.stringify(arr)); }

/* ---------- LOGIN PAGE (visual only) ---------- */
if(document.body.dataset.page === "home"){
  $("#loginForm").addEventListener("submit", e=>{ e.preventDefault(); location.href="backlog.html"; });
  $("#showRegister").addEventListener("click", e=>{ e.preventDefault(); location.href="register.html"; });
}

/* ---------- REGISTER PAGE (visual only) ---------- */
if(document.body.dataset.page === "register"){
  $("#registerForm").addEventListener("submit", e=>{ e.preventDefault(); location.href="backlog.html"; });
}

/* ---------- Helper: fetch cover from RAWG ---------- */
async function fetchCover(title){
  if(!RAWG_KEY || RAWG_KEY === "YOUR_RAWG_API_KEY_HERE") return "assets/placeholder.jpg";
  const url = `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(title)}&page_size=1`;
  try{
    const res = await fetch(url);
    const data = await res.json();
    if(data.results && data.results.length && data.results[0].background_image){
      return data.results[0].background_image;
    }
  }catch(err){ /* ignore network/API errors */ }
  return "assets/placeholder.jpg";
}

/* ---------- BACKLOG PAGE ---------- */
if(document.body.dataset.page === "backlog"){
  const sortBtns   = document.querySelectorAll(".sortBtn");
  const addBtn     = $("#addGameBtn");
  const modal      = $("#addModal");
  const form       = $("#addForm");
  const closeModal = $("#closeModal");
  const grid       = $("#gameGrid");

  let sortMode = "title";

  sortBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      sortMode = btn.dataset.sort;
      sortBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  addBtn.addEventListener("click", ()=> modal.classList.add("show"));
  closeModal.addEventListener("click", ()=> modal.classList.remove("show"));
  modal.addEventListener("click", e=>{ if(e.target === modal) modal.classList.remove("show"); });

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const title    = $("#titleInput").value.trim();
    const platform = $("#platformInput").value;
    const status   = $("#statusInput").value;
    const desc     = $("#descInput").value.trim();
    if(!title || !platform || !status){
      alert("Please complete required fields.");
      return;
    }

    const games = loadGames();
    const imageURL = await fetchCover(title);

    games.push({ id: Date.now(), title, platform, status, description: desc, added: Date.now(), image: imageURL });
    saveGames(games);
    form.reset();
    modal.classList.remove("show");
    render();
  });

  function render(){
    const games = loadGames();
    let list = [...games];
    switch(sortMode){
      case "title":   list.sort((a,b)=> a.title.localeCompare(b.title)); break;
      case "recent":  list.sort((a,b)=> b.added - a.added); break;
      case "console": list.sort((a,b)=> a.platform.localeCompare(b.platform)); break;
      case "genre":   list.sort((a,b)=> (a.genre||'').localeCompare(b.genre||'')); break;
    }
    grid.innerHTML = "";
    list.forEach(g=>{
      const card = document.querySelector("#cardTmpl").content.cloneNode(true);
      const img  = card.querySelector("img");
      img.src = g.image || "assets/placeholder.jpg";
      img.alt = g.title;
      grid.appendChild(card);
    });
  }

  render();
}

/* ---------- DESCRIPTION PAGE ---------- */
if(document.body.dataset.page === "description"){
  const id = new URLSearchParams(location.search).get("id");
  let games = loadGames();
  const game = games.find(g => String(g.id) === id);
  if(!game){ alert("Game not found."); location.href = "backlog.html"; }

  $("#gameTitle").textContent    = game.title;
  $("#gamePlatform").textContent = game.platform;
  $("#gameDate").textContent     = new Date(game.added).toLocaleDateString();
  $("#gameDesc").textContent     = game.description || "";
  $("#coverImg")?.setAttribute("src", game.image || "assets/placeholder.jpg");

  const statusSel = $("#statusSelect");
  statusSel.value = game.status;
  statusSel.addEventListener("change", ()=>{
    game.status = statusSel.value;
    saveGames(games);
  });

  $("#backBtn")?.addEventListener("click", ()=> history.back() );
  $("#deleteBtn")?.addEventListener("click", ()=>{
    if(confirm("Delete this game?")){
      games = games.filter(g => g.id !== game.id);
      saveGames(games);
      location.href = "backlog.html";
    }
  });
}
})();