(function () {
  const OWNER_EMAIL = "deavonvanschaik2@gmail.com";
  const DEFAULT_CHAT = [
    { user: "System", msg: "Welcome to Cosmic Core.", time: Date.now() - 60000 },
    { user: "System", msg: "Add Firebase config for real cloud and global multiplayer.", time: Date.now() - 30000 }
  ];

  const $ = (id) => document.getElementById(id);

  const el = {
    loginScreen: $("loginScreen"),
    app: $("app"),
    emailInput: $("emailInput"),
    passwordInput: $("passwordInput"),
    displayNameInput: $("displayNameInput"),
    displayNameField: $("displayNameField"),
    authStatus: $("authStatus"),
    authPrimaryBtn: $("authPrimaryBtn"),
    guestBtn: $("guestBtn"),
    playerLabel: $("playerLabel"),
    pointsLabel: $("pointsLabel"),
    ppsLabel: $("ppsLabel"),
    gemsLabel: $("gemsLabel"),
    darkLabel: $("darkLabel"),
    modeBadge: $("modeBadge"),
    coreButton: $("coreButton"),
    floatingLayer: $("floatingLayer"),
    newsFeed: $("newsFeed"),
    achievementsList: $("achievementsList"),
    leaderboardList: $("leaderboardList"),
    chatMessages: $("chatMessages"),
    chatInput: $("chatInput"),
    chatSendBtn: $("chatSendBtn"),
    shopList: $("shopList"),
    skillsList: $("skillsList"),
    buildingsList: $("buildingsList"),
    statsList: $("statsList"),
    bossStatus: $("bossStatus"),
    spawnBossBtn: $("spawnBossBtn"),
    prestigeBtn: $("prestigeBtn"),
    ascendBtn: $("ascendBtn"),
    rebirthBtn: $("rebirthBtn"),
    exportSaveBtn: $("exportSaveBtn"),
    importSaveBtn: $("importSaveBtn"),
    importSaveInput: $("importSaveInput"),
    signOutBtn: $("signOutBtn"),
    resetSaveBtn: $("resetSaveBtn"),
    adminPointsBtn: $("adminPointsBtn"),
    adminGemsBtn: $("adminGemsBtn"),
    adminUnlockBtn: $("adminUnlockBtn"),
    adminMaxBtn: $("adminMaxBtn"),
    adminBossBtn: $("adminBossBtn"),
    toastRoot: $("toastRoot"),
  };

  const authTabs = [...document.querySelectorAll("[data-auth-tab]")];
  const navButtons = [...document.querySelectorAll(".nav-btn")];
  const adminOnly = [...document.querySelectorAll(".admin-only")];

  const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const decimalFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

  const state = {
    mode: "local",
    authView: "login",
    user: null,
    saveKey: null,
    data: null,
    boss: null,
    liveCloudUnsub: null,
    leaderboardUnsub: null,
    chatUnsub: null,
    tickTimer: null,
    autosaveTimer: null,
  };

  const definitions = {
    shop: [
      { key: "clickPower", label: "Click Power", desc: "+1 energy per click", base: 15, mult: 1.16, buy: s => s.clickPower += 1 },
      { key: "autoTap", label: "Auto Tapper", desc: "+1 energy per second", base: 30, mult: 1.18, buy: s => s.autoTap += 1 },
      { key: "critChance", label: "Crit Chance", desc: "+2% crit chance", base: 120, mult: 1.25, buy: s => s.critChance = Math.min(0.75, s.critChance + 0.02) },
      { key: "critPower", label: "Crit Power", desc: "+0.5x crit multiplier", base: 160, mult: 1.24, buy: s => s.critPower += 0.5 },
    ],
    skills: [
      { key: "overdrive", label: "Overdrive", desc: "Clicks x2", cost: 400 },
      { key: "droneSwarm", label: "Drone Swarm", desc: "Passive x2", cost: 900 },
      { key: "echoPulse", label: "Echo Pulse", desc: "Every 15s gain a burst of energy", cost: 1500 },
      { key: "luckyStar", label: "Lucky Star", desc: "Crit chance +10%", cost: 2200 },
    ],
    buildings: [
      { key: "reactor", label: "Reactor", desc: "+5 energy/sec", base: 250, mult: 1.28, add: 5 },
      { key: "lab", label: "Quantum Lab", desc: "+18 energy/sec", base: 1300, mult: 1.34, add: 18 },
      { key: "station", label: "Orbital Station", desc: "+65 energy/sec", base: 8200, mult: 1.4, add: 65 },
    ],
    achievements: [
      { key: "a1", label: "First Spark", check: s => s.points >= 10 },
      { key: "a2", label: "Power Grid", check: s => s.autoTap >= 10 },
      { key: "a3", label: "Critical Mass", check: s => s.critChance >= 0.2 },
      { key: "a4", label: "Tycoon", check: s => s.totalGenerated >= 100000 },
      { key: "a5", label: "Gem Hunter", check: s => s.gems >= 25 },
    ],
  };

  function defaultSave() {
    return {
      version: 1,
      email: null,
      displayName: "Guest",
      points: 0,
      gems: 0,
      darkMatter: 0,
      clickPower: 1,
      autoTap: 0,
      critChance: 0.05,
      critPower: 2,
      prestigeCount: 0,
      ascendCount: 0,
      rebirthCount: 0,
      prestigeBoost: 1,
      skillFlags: {},
      buildingCounts: { reactor: 0, lab: 0, station: 0 },
      totalGenerated: 0,
      totalClicks: 0,
      bossKills: 0,
      achievements: {},
      lastTick: Date.now(),
      announcements: [],
    };
  }

  function hasFirebase() {
    return !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.firebase);
  }

  function initFirebase() {
    if (!hasFirebase()) return null;
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    return {
      auth: firebase.auth(),
      db: firebase.firestore(),
    };
  }

  const fb = initFirebase();

  function setAuthView(view) {
    state.authView = view;
    authTabs.forEach(btn => btn.classList.toggle("active", btn.dataset.authTab === view));
    el.displayNameField.style.display = view === "register" ? "block" : "none";
    el.authPrimaryBtn.textContent = view === "register" ? "Register" : "Login";
  }

  authTabs.forEach(btn => btn.addEventListener("click", () => setAuthView(btn.dataset.authTab)));

  el.authPrimaryBtn.addEventListener("click", async () => {
    if (state.authView === "register") await registerAccount();
    else await loginAccount();
  });

  el.guestBtn.addEventListener("click", () => {
    const displayName = "Guest-" + Math.floor(Math.random() * 10000);
    state.mode = "local";
    state.user = { email: null, uid: "guest-" + Date.now(), displayName };
    state.saveKey = "cosmic_guest_" + state.user.uid;
    state.data = loadLocalSave(state.saveKey, displayName);
    startGame();
  });

  navButtons.forEach(btn => btn.addEventListener("click", () => openTab(btn.dataset.tab)));

  function openTab(name) {
    navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    const section = $("tab-" + name);
    if (section) section.classList.add("active");
  }

  async function registerAccount() {
    const email = el.emailInput.value.trim().toLowerCase();
    const password = el.passwordInput.value;
    const displayName = (el.displayNameInput.value.trim() || email.split("@")[0] || "Player").slice(0, 24);

    if (!email || !password) return toast("Enter email and password.");
    if (password.length < 6) return toast("Password must be at least 6 characters.");

    if (fb) {
      try {
        const cred = await fb.auth.createUserWithEmailAndPassword(email, password);
        state.mode = "cloud";
        state.user = { email, uid: cred.user.uid, displayName };
        state.saveKey = cred.user.uid;
        state.data = await loadCloudSave(displayName);
        await updateCloudPresence();
        startGame();
      } catch (err) {
        toast(err.message || "Could not register.");
      }
    } else {
      const users = JSON.parse(localStorage.getItem("cosmic_users") || "{}");
      if (users[email]) return toast("Account already exists.");
      users[email] = { password, displayName };
      localStorage.setItem("cosmic_users", JSON.stringify(users));
      state.mode = "local";
      state.user = { email, uid: "local-" + email, displayName };
      state.saveKey = "cosmic_save_" + email;
      state.data = loadLocalSave(state.saveKey, displayName, email);
      saveLocal();
      startGame();
    }
  }

  async function loginAccount() {
    const email = el.emailInput.value.trim().toLowerCase();
    const password = el.passwordInput.value;
    if (!email || !password) return toast("Enter email and password.");

    if (fb) {
      try {
        const cred = await fb.auth.signInWithEmailAndPassword(email, password);
        state.mode = "cloud";
        state.user = { email, uid: cred.user.uid, displayName: email.split("@")[0] };
        state.saveKey = cred.user.uid;
        state.data = await loadCloudSave();
        await updateCloudPresence();
        startGame();
      } catch (err) {
        toast(err.message || "Could not login.");
      }
    } else {
      const users = JSON.parse(localStorage.getItem("cosmic_users") || "{}");
      const record = users[email];
      if (!record) return toast("No account found.");
      if (record.password !== password) return toast("Wrong password.");
      state.mode = "local";
      state.user = { email, uid: "local-" + email, displayName: record.displayName || email.split("@")[0] };
      state.saveKey = "cosmic_save_" + email;
      state.data = loadLocalSave(state.saveKey, state.user.displayName, email);
      startGame();
    }
  }

  function loadLocalSave(key, displayName, email = null) {
    const raw = localStorage.getItem(key);
    const merged = Object.assign(defaultSave(), raw ? JSON.parse(raw) : {});
    merged.displayName = merged.displayName || displayName;
    merged.email = email || merged.email;
    merged.lastTick = merged.lastTick || Date.now();
    applyOfflineProgress(merged);
    return merged;
  }

  async function loadCloudSave(fallbackName = "Player") {
    const docRef = fb.db.collection("players").doc(state.user.uid);
    const snap = await docRef.get();
    const merged = Object.assign(defaultSave(), snap.exists ? snap.data() : {});
    merged.displayName = merged.displayName || fallbackName;
    merged.email = state.user.email;
    merged.lastTick = merged.lastTick || Date.now();
    applyOfflineProgress(merged);
    return merged;
  }

  function applyOfflineProgress(save) {
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - save.lastTick) / 1000));
    const gain = elapsed * getPps(save);
    if (gain > 0) {
      save.points += gain;
      save.totalGenerated += gain;
      save.announcements.unshift(`Offline gain: +${format(gain)} energy`);
      save.announcements = save.announcements.slice(0, 8);
    }
    save.lastTick = now;
  }

  function getPps(s = state.data) {
    let pps = s.autoTap;
    pps += s.buildingCounts.reactor * 5;
    pps += s.buildingCounts.lab * 18;
    pps += s.buildingCounts.station * 65;
    if (s.skillFlags.droneSwarm) pps *= 2;
    pps *= s.prestigeBoost;
    return pps;
  }

  function getClickValue(s = state.data) {
    let value = s.clickPower * s.prestigeBoost;
    if (s.skillFlags.overdrive) value *= 2;
    return value;
  }

  function getPrice(base, mult, owned) {
    return Math.floor(base * Math.pow(mult, owned));
  }

  function saveLocal() {
    if (!state.saveKey || !state.data) return;
    state.data.lastTick = Date.now();
    localStorage.setItem(state.saveKey, JSON.stringify(state.data));
    updateLocalLeaderboard();
    updateLocalChat();
  }

  async function saveCloud() {
    if (!fb || !state.user || !state.data) return;
    state.data.lastTick = Date.now();
    await fb.db.collection("players").doc(state.user.uid).set({
      ...state.data,
      leaderboardName: state.data.displayName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await fb.db.collection("leaderboard").doc(state.user.uid).set({
      displayName: state.data.displayName,
      points: state.data.points,
      totalGenerated: state.data.totalGenerated,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async function saveGame() {
    if (state.mode === "cloud" && fb) await saveCloud();
    else saveLocal();
  }

  function isOwner() {
    return !!state.user && state.user.email === OWNER_EMAIL;
  }

  function startGame() {
    el.loginScreen.classList.add("hidden");
    el.app.classList.remove("hidden");
    el.playerLabel.textContent = `${state.user.displayName}${state.user.email ? " • " + state.user.email : ""}`;
    el.modeBadge.textContent = state.mode === "cloud" ? "Cloud" : "Local";
    adminOnly.forEach(node => node.classList.toggle("hidden", !isOwner()));
    renderAll();
    openTab("shop");
    startLoop();
    hookCloudListeners();
    toast(state.mode === "cloud" ? "Cloud mode enabled." : "Running in local mode.");
  }

  function startLoop() {
    if (state.tickTimer) clearInterval(state.tickTimer);
    if (state.autosaveTimer) clearInterval(state.autosaveTimer);

    let echoCounter = 0;

    state.tickTimer = setInterval(() => {
      const pps = getPps();
      state.data.points += pps;
      state.data.totalGenerated += pps;

      echoCounter++;
      if (state.data.skillFlags.echoPulse && echoCounter >= 15) {
        const bonus = Math.max(50, Math.floor(getPps() * 4));
        state.data.points += bonus;
        state.data.totalGenerated += bonus;
        state.data.announcements.unshift(`Echo Pulse triggered for +${format(bonus)} energy`);
        state.data.announcements = state.data.announcements.slice(0, 8);
        echoCounter = 0;
        toast(`Echo Pulse +${format(bonus)}`);
      }

      tickBossDamage();
      unlockAchievements();
      renderAll();
    }, 1000);

    state.autosaveTimer = setInterval(() => saveGame(), 5000);
  }

  function tickBossDamage() {
    if (!state.boss) return;
    if (state.boss.hp <= 0) return;
    state.boss.hp -= Math.max(1, Math.floor(getPps() * 0.2));
    if (state.boss.hp <= 0) defeatBoss();
    renderBoss();
  }

  function renderAll() {
    renderTop();
    renderNews();
    renderAchievements();
    renderShop();
    renderSkills();
    renderBuildings();
    renderStats();
    renderBoss();
    renderLeaderboardLocalFallback();
    renderChatLocalFallback();
  }

  function renderTop() {
    el.pointsLabel.textContent = format(state.data.points);
    el.ppsLabel.textContent = format(getPps());
    el.gemsLabel.textContent = format(state.data.gems);
    el.darkLabel.textContent = format(state.data.darkMatter);
  }

  function renderNews() {
    const feed = [];
    if (state.mode === "cloud") feed.push("Connected to cloud save and live services.");
    else feed.push("Local mode active. Firebase config enables real online services.");
    feed.push(...state.data.announcements.slice(0, 5));
    el.newsFeed.innerHTML = feed.map(x => `<div class="item">${escapeHtml(x)}</div>`).join("");
  }

  function renderAchievements() {
    const list = definitions.achievements.map(a => {
      const done = !!state.data.achievements[a.key];
      return `<div class="item">${done ? "🏆" : "⬜"} ${escapeHtml(a.label)}</div>`;
    }).join("");
    el.achievementsList.innerHTML = list || `<div class="item muted">No achievements yet.</div>`;
  }

  function renderShop() {
    el.shopList.innerHTML = definitions.shop.map(def => {
      const owned = Math.floor(state.data[def.key] || 0);
      const price = getPrice(def.base, def.mult, owned);
      return itemRow(def.label, `${def.desc} • Owned: ${owned}`, price, () => buyShop(def, price));
    }).join("");
    wireActionButtons();
  }

  function renderSkills() {
    el.skillsList.innerHTML = definitions.skills.map(def => {
      const owned = !!state.data.skillFlags[def.key];
      return itemRow(def.label, def.desc + (owned ? " • Unlocked" : ""), def.cost, () => buySkill(def), owned ? "Unlocked" : "Unlock", owned);
    }).join("");
    wireActionButtons();
  }

  function renderBuildings() {
    el.buildingsList.innerHTML = definitions.buildings.map(def => {
      const owned = state.data.buildingCounts[def.key] || 0;
      const price = getPrice(def.base, def.mult, owned);
      return itemRow(def.label, `${def.desc} • Built: ${owned}`, price, () => buyBuilding(def, price));
    }).join("");
    wireActionButtons();
  }

  function renderStats() {
    const rows = [
      ["Total energy", state.data.totalGenerated],
      ["Total clicks", state.data.totalClicks],
      ["Boss kills", state.data.bossKills],
      ["Prestige count", state.data.prestigeCount],
      ["Ascend count", state.data.ascendCount],
      ["Rebirth count", state.data.rebirthCount],
      ["Click value", getClickValue()],
      ["Crit chance", Math.round((getCritChance()) * 100) + "%"],
    ];
    el.statsList.innerHTML = rows.map(([k, v]) => `<div class="stat-line"><strong>${escapeHtml(k)}</strong><div class="muted">${escapeHtml(String(typeof v === "number" ? format(v) : v))}</div></div>`).join("");
  }

  function renderBoss() {
    if (!state.boss || state.boss.hp <= 0) {
      el.bossStatus.textContent = "No boss active.";
      return;
    }
    el.bossStatus.textContent = `${state.boss.name}: ${format(state.boss.hp)} HP`;
  }

  function itemRow(title, desc, price, handler, buttonText = "Buy", disabled = false) {
    const id = "act_" + Math.random().toString(36).slice(2);
    pendingActions[id] = handler;
    const afford = state.data.points >= price;
    return `
      <div class="item shop-row">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(desc)}</p>
        </div>
        <button ${disabled ? "disabled" : ""} data-action="${id}" class="${!disabled && afford ? "" : "secondary"}">${escapeHtml(buttonText)}<br>${disabled ? "" : format(price)}</button>
      </div>
    `;
  }

  const pendingActions = {};
  function wireActionButtons() {
    document.querySelectorAll("[data-action]").forEach(btn => {
      btn.onclick = () => {
        const fn = pendingActions[btn.dataset.action];
        if (fn) fn();
      };
    });
  }

  function buyShop(def, price) {
    if (state.data.points < price) return toast("Not enough energy.");
    state.data.points -= price;
    def.buy(state.data);
    state.data.announcements.unshift(`${def.label} upgraded.`);
    state.data.announcements = state.data.announcements.slice(0, 8);
    unlockAchievements();
    renderAll();
  }

  function buySkill(def) {
    if (state.data.skillFlags[def.key]) return;
    if (state.data.points < def.cost) return toast("Not enough energy.");
    state.data.points -= def.cost;
    state.data.skillFlags[def.key] = true;
    state.data.announcements.unshift(`${def.label} unlocked.`);
    if (def.key === "luckyStar") state.data.critChance += 0.1;
    renderAll();
  }

  function buyBuilding(def, price) {
    if (state.data.points < price) return toast("Not enough energy.");
    state.data.points -= price;
    state.data.buildingCounts[def.key] += 1;
    state.data.announcements.unshift(`${def.label} constructed.`);
    state.data.announcements = state.data.announcements.slice(0, 8);
    renderAll();
  }

  function getCritChance() {
    return Math.min(0.95, state.data.critChance);
  }

  function clickCore() {
    let gain = getClickValue();
    let crit = false;
    if (Math.random() < getCritChance()) {
      gain *= state.data.critPower;
      crit = true;
    }
    gain = Math.floor(gain);
    state.data.points += gain;
    state.data.totalGenerated += gain;
    state.data.totalClicks += 1;
    spawnFloat("+" + format(gain) + (crit ? " CRIT" : ""));
    if (state.boss && state.boss.hp > 0) {
      state.boss.hp -= gain;
      if (state.boss.hp <= 0) defeatBoss();
    }
    unlockAchievements();
    renderAll();
  }

  function spawnFloat(text) {
    const node = document.createElement("div");
    node.className = "float-text";
    node.textContent = text;
    node.style.left = (50 + (Math.random() * 14 - 7)) + "%";
    node.style.top = (50 + (Math.random() * 6 - 3)) + "%";
    el.floatingLayer.appendChild(node);
    setTimeout(() => node.remove(), 850);
  }

  function unlockAchievements() {
    definitions.achievements.forEach(a => {
      if (!state.data.achievements[a.key] && a.check(state.data)) {
        state.data.achievements[a.key] = true;
        toast(`Achievement unlocked: ${a.label}`);
      }
    });
  }

  function prestige() {
    if (state.data.points < 5000) return toast("Need 5,000 energy to prestige.");
    state.data.prestigeCount += 1;
    state.data.gems += Math.max(1, Math.floor(state.data.points / 5000));
    state.data.prestigeBoost += 0.25;
    resetRunState();
    state.data.announcements.unshift("Prestige completed. Permanent boost increased.");
    renderAll();
  }

  function ascend() {
    if (state.data.gems < 20) return toast("Need 20 gems to ascend.");
    state.data.ascendCount += 1;
    state.data.darkMatter += 5 + state.data.ascendCount;
    state.data.gems -= 20;
    state.data.prestigeBoost += 0.5;
    resetRunState();
    state.data.announcements.unshift("Ascension complete. Dark Matter gained.");
    renderAll();
  }

  function rebirth() {
    if (state.data.darkMatter < 25) return toast("Need 25 Dark Matter to rebirth.");
    state.data.rebirthCount += 1;
    state.data.darkMatter -= 25;
    state.data.prestigeBoost += 1.0;
    resetRunState();
    state.data.announcements.unshift("Rebirth complete. Core power surged.");
    renderAll();
  }

  function resetRunState() {
    state.data.points = 0;
    state.data.clickPower = 1;
    state.data.autoTap = 0;
    state.data.critChance = 0.05 + (state.data.skillFlags.luckyStar ? 0.1 : 0);
    state.data.critPower = 2;
    state.data.buildingCounts = { reactor: 0, lab: 0, station: 0 };
    state.boss = null;
  }

  function spawnBoss() {
    if (state.boss && state.boss.hp > 0) return toast("Boss already active.");
    const base = 3000 + state.data.bossKills * 1250 + state.data.prestigeCount * 1000;
    state.boss = { name: "Void Anomaly", hp: base };
    renderBoss();
    toast("Boss spawned.");
  }

  function defeatBoss() {
    if (!state.boss) return;
    const reward = 500 + state.data.bossKills * 250;
    state.data.points += reward;
    state.data.gems += 2;
    state.data.totalGenerated += reward;
    state.data.bossKills += 1;
    state.data.announcements.unshift(`Boss defeated for +${format(reward)} energy and +2 gems`);
    state.data.announcements = state.data.announcements.slice(0, 8);
    state.boss = null;
    toast("Boss defeated.");
  }

  function updateLocalLeaderboard() {
    const board = JSON.parse(localStorage.getItem("cosmic_leaderboard_local") || "[]");
    const playerId = state.user.email || state.user.uid;
    const existing = board.find(p => p.id === playerId);
    const payload = {
      id: playerId,
      displayName: state.data.displayName,
      points: state.data.points,
      totalGenerated: state.data.totalGenerated,
      updatedAt: Date.now(),
    };
    if (existing) Object.assign(existing, payload);
    else board.push(payload);
    board.sort((a,b) => b.totalGenerated - a.totalGenerated);
    localStorage.setItem("cosmic_leaderboard_local", JSON.stringify(board.slice(0, 25)));
  }

  function renderLeaderboardLocalFallback() {
    if (state.mode === "cloud" && fb) return;
    const board = JSON.parse(localStorage.getItem("cosmic_leaderboard_local") || "[]").slice(0, 10);
    el.leaderboardList.innerHTML = board.map((p, i) => `<div class="leader-line"><strong>#${i+1} ${escapeHtml(p.displayName)}</strong><div class="muted">${format(p.totalGenerated)} total</div></div>`).join("") || `<div class="leader-line muted">No leaderboard entries yet.</div>`;
  }

  function updateLocalChat() {
    const room = JSON.parse(localStorage.getItem("cosmic_chat_local") || JSON.stringify(DEFAULT_CHAT));
    localStorage.setItem("cosmic_chat_local", JSON.stringify(room.slice(0, 50)));
  }

  function renderChatLocalFallback() {
    if (state.mode === "cloud" && fb) return;
    const room = JSON.parse(localStorage.getItem("cosmic_chat_local") || JSON.stringify(DEFAULT_CHAT));
    el.chatMessages.innerHTML = room.slice(-20).reverse().map(msg => `<div class="chat-line"><strong>${escapeHtml(msg.user)}</strong><div class="muted">${escapeHtml(msg.msg)}</div></div>`).join("");
  }

  async function sendChat() {
    const msg = el.chatInput.value.trim();
    if (!msg) return;
    if (state.mode === "cloud" && fb) {
      await fb.db.collection("chat").add({
        user: state.data.displayName,
        uid: state.user.uid,
        msg,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const room = JSON.parse(localStorage.getItem("cosmic_chat_local") || JSON.stringify(DEFAULT_CHAT));
      room.push({ user: state.data.displayName, msg, time: Date.now() });
      localStorage.setItem("cosmic_chat_local", JSON.stringify(room.slice(-50)));
      renderChatLocalFallback();
    }
    el.chatInput.value = "";
  }

  function hookCloudListeners() {
    if (!(state.mode === "cloud" && fb && state.user)) return;

    if (state.leaderboardUnsub) state.leaderboardUnsub();
    if (state.chatUnsub) state.chatUnsub();

    state.leaderboardUnsub = fb.db.collection("leaderboard")
      .orderBy("totalGenerated", "desc")
      .limit(10)
      .onSnapshot(snap => {
        el.leaderboardList.innerHTML = snap.docs.map((doc, i) => {
          const d = doc.data();
          return `<div class="leader-line"><strong>#${i+1} ${escapeHtml(d.displayName || "Player")}</strong><div class="muted">${format(d.totalGenerated || 0)} total</div></div>`;
        }).join("") || `<div class="leader-line muted">No leaderboard entries yet.</div>`;
      });

    state.chatUnsub = fb.db.collection("chat")
      .orderBy("createdAt", "desc")
      .limit(20)
      .onSnapshot(snap => {
        el.chatMessages.innerHTML = snap.docs.map(doc => {
          const d = doc.data();
          return `<div class="chat-line"><strong>${escapeHtml(d.user || "Player")}</strong><div class="muted">${escapeHtml(d.msg || "")}</div></div>`;
        }).join("");
      });
  }

  async function updateCloudPresence() {
    if (!(state.mode === "cloud" && fb && state.user)) return;
    await fb.db.collection("presence").doc(state.user.uid).set({
      displayName: state.user.displayName,
      online: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  function exportSave() {
    const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cosmic-core-save.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSaveFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        state.data = Object.assign(defaultSave(), parsed);
        renderAll();
        saveGame();
        toast("Save imported.");
      } catch {
        toast("Invalid save file.");
      }
    };
    reader.readAsText(file);
  }

  async function signOut() {
    if (state.tickTimer) clearInterval(state.tickTimer);
    if (state.autosaveTimer) clearInterval(state.autosaveTimer);
    if (state.leaderboardUnsub) state.leaderboardUnsub();
    if (state.chatUnsub) state.chatUnsub();
    if (state.mode === "cloud" && fb) {
      try {
        await fb.auth.signOut();
      } catch {}
    }
    location.reload();
  }

  function resetSave() {
    if (!confirm("Reset this save?")) return;
    state.data = defaultSave();
    state.data.displayName = state.user.displayName;
    state.data.email = state.user.email;
    renderAll();
    saveGame();
    toast("Save reset.");
  }

  function adminGrantPoints() { state.data.points += 100000; renderAll(); }
  function adminGrantGems() { state.data.gems += 5000; renderAll(); }
  function adminUnlockEverything() {
    definitions.skills.forEach(s => state.data.skillFlags[s.key] = true);
    state.data.critChance = 0.5;
    state.data.critPower = 8;
    state.data.prestigeBoost = 10;
    state.data.buildingCounts = { reactor: 20, lab: 12, station: 6 };
    state.data.autoTap = 150;
    renderAll();
  }
  function adminMaxStats() {
    state.data.clickPower = 500;
    state.data.autoTap = 1000;
    state.data.gems = 99999;
    state.data.darkMatter = 9999;
    renderAll();
  }
  function adminDeleteBoss() { state.boss = null; renderBoss(); }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    el.toastRoot.appendChild(node);
    setTimeout(() => node.remove(), 2800);
  }

  function format(n) {
    return n >= 1000000 ? decimalFmt.format(n / 1000000) + "M" :
           n >= 1000 ? decimalFmt.format(n / 1000) + "K" :
           numberFmt.format(Math.floor(n));
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  el.coreButton.addEventListener("click", clickCore);
  el.spawnBossBtn.addEventListener("click", spawnBoss);
  el.prestigeBtn.addEventListener("click", prestige);
  el.ascendBtn.addEventListener("click", ascend);
  el.rebirthBtn.addEventListener("click", rebirth);
  el.chatSendBtn.addEventListener("click", sendChat);
  el.exportSaveBtn.addEventListener("click", exportSave);
  el.importSaveBtn.addEventListener("click", () => el.importSaveInput.click());
  el.importSaveInput.addEventListener("change", (e) => e.target.files[0] && importSaveFile(e.target.files[0]));
  el.signOutBtn.addEventListener("click", signOut);
  el.resetSaveBtn.addEventListener("click", resetSave);
  el.adminPointsBtn.addEventListener("click", adminGrantPoints);
  el.adminGemsBtn.addEventListener("click", adminGrantGems);
  el.adminUnlockBtn.addEventListener("click", adminUnlockEverything);
  el.adminMaxBtn.addEventListener("click", adminMaxStats);
  el.adminBossBtn.addEventListener("click", adminDeleteBoss);

  setAuthView("login");
  el.authStatus.textContent = fb ? "Firebase detected. Cloud mode available." : "Firebase not configured. Local mode active.";
})();
