/* ===================================================================
   LoL Cooldown Calculator - core logic
   CHAMP_DATA comes from data.js: { id: { name, title, abilities:{Q,W,E,R:{name,cooldown[],maxrank}}, skillOrder } }
   =================================================================== */

var ABIL_KEYS = ["Q", "W", "E", "R"];
var R_BREAKPOINTS = [6, 11, 16];

/* Summoner spell base cooldowns (seconds), Summoner's Rift, current values per
   wiki.leagueoflegends.com individual spell pages. Smite is shown at its steady-state
   90s per-charge recharge time (it has a 2-charge system with a short initial cooldown). */
var SUMMONER_SPELLS = [
  { id: "flash", name: "Flash", abbr: "FL", cooldown: 300 },
  { id: "teleport", name: "Teleport", abbr: "TP", cooldown: 300 },
  { id: "heal", name: "Heal", abbr: "HL", cooldown: 240 },
  { id: "cleanse", name: "Cleanse", abbr: "CL", cooldown: 240 },
  { id: "exhaust", name: "Exhaust", abbr: "EX", cooldown: 240 },
  { id: "ghost", name: "Ghost", abbr: "GH", cooldown: 240 },
  { id: "barrier", name: "Barrier", abbr: "BR", cooldown: 180 },
  { id: "ignite", name: "Ignite (Dot)", abbr: "IG", cooldown: 180 },
  { id: "smite", name: "Smite", abbr: "SM", cooldown: 90 }
];

/* ---- cooldown tracker overlay: click an icon to start counting down its
   currently-computed effective CD; click again while on cooldown to reset
   it back to ready. Keyed by ability letter (Q/W/E/R) or spell slot
   (spell1/spell2), independent of the render cycle. ---- */
var trackers = { Q: null, W: null, E: null, R: null, spell1: null, spell2: null };
var TRACK_TICK_MS = 250;

function toggleTracker(key, cd) {
  if (trackers[key]) {
    trackers[key] = null;
  } else {
    cd = parseFloat(cd);
    if (!cd || isNaN(cd) || cd <= 0) return;
    trackers[key] = { endTime: Date.now() + cd * 1000 };
  }
  updateTrackIcon(key);
}

function updateTrackIcon(key) {
  var icon = document.querySelector('.trackIcon[data-key="' + key + '"]');
  if (!icon) return;
  var timeEl = icon.querySelector(".trackTime");
  var t = trackers[key];
  if (t) {
    var remaining = Math.max(0, (t.endTime - Date.now()) / 1000);
    icon.classList.add("onCooldown");
    if (timeEl) timeEl.textContent = Math.ceil(remaining);
  } else {
    icon.classList.remove("onCooldown");
    if (timeEl) timeEl.textContent = "";
  }
}

function tickTrackers() {
  Object.keys(trackers).forEach(function (key) {
    if (trackers[key]) {
      if (trackers[key].endTime - Date.now() <= 0) trackers[key] = null;
      updateTrackIcon(key);
    }
  });
}

function trackIconHtml(key, label, cd, disabled) {
  var cls = "trackIcon" + (disabled ? " trackDisabled" : "");
  var cdAttr = disabled ? "" : cd;
  return '<span class="' + cls + '" data-key="' + key + '" data-cd="' + cdAttr + '">' +
    '<span class="trackLabel">' + label + '</span><span class="trackTime"></span></span>';
}

function bindTrackClicks(containerId) {
  document.getElementById(containerId).addEventListener("click", function (e) {
    var icon = e.target.closest(".trackIcon");
    if (!icon || icon.classList.contains("trackDisabled")) return;
    toggleTracker(icon.getAttribute("data-key"), icon.getAttribute("data-cd"));
  });
}

var state = {
  championId: null,
  level: 18,
  haste: 0,
  overrides: {}, // { Q: rank or null }
  spell1: "flash",
  spell2: "heal",
  lucidBoots: false,
  cosmicInsight: false
};

// ---- build champion list, sorted by name ----
var CHAMP_LIST = Object.keys(CHAMP_DATA).map(function (id) {
  return { id: id, name: CHAMP_DATA[id].name };
}).sort(function (a, b) { return a.name.localeCompare(b.name); });

function computeAutoRanks(champ, level) {
  var abil = champ.abilities;
  var order = champ.skillOrder.split(""); // e.g. ["Q","E","W"]
  var maxRank = {};
  ABIL_KEYS.forEach(function (k) { maxRank[k] = abil[k].cooldown.length; });

  var rank = { Q: 0, W: 0, E: 0, R: 0 };
  var rMax = maxRank.R;
  var rBreak = R_BREAKPOINTS.slice(0, rMax);

  // phase 1: one point into each of the priority abilities, in order,
  // as levels become available (levels 1..3)
  var phase1Levels = Math.min(3, order.length);
  for (var lvl = 1; lvl <= level && lvl <= phase1Levels; lvl++) {
    var abilKey = order[lvl - 1];
    if (rank[abilKey] < maxRank[abilKey]) rank[abilKey] = 1;
  }

  // phase 2: from level 4 onward, R at breakpoints takes priority,
  // otherwise fill priority abilities in order until each is maxed
  for (var lvl2 = phase1Levels + 1; lvl2 <= level; lvl2++) {
    if (rBreak.indexOf(lvl2) !== -1 && rank.R < rMax) {
      rank.R++;
      continue;
    }
    var filled = false;
    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      if (rank[k] < maxRank[k]) {
        rank[k]++;
        filled = true;
        break;
      }
    }
    // if all Q/W/E are maxed but R breakpoint not yet reached, point is
    // effectively unused (can't happen with standard 5/5/5/3 champions)
  }

  // special case: abilities with only a single possible value (flat,
  // rank-independent cooldowns / simple toggles) are always "active"
  ABIL_KEYS.forEach(function (k) {
    if (maxRank[k] === 1) rank[k] = 1;
  });

  return rank;
}

function effectiveCooldown(base, haste) {
  return base / (1 + haste / 100);
}

function formatSeconds(sec) {
  if (sec == null) return "&mdash;";
  var totalMs = Math.round(sec * 100); // keep 2 decimals of precision internally
  var totalSec = totalMs / 100;
  var m = Math.floor(totalSec / 60);
  var s = totalSec - m * 60;
  var sStr = (Math.round(s * 100) / 100).toString();
  if (m > 0) {
    return m + "m " + sStr + "s";
  }
  return sStr + "s";
}

function el(tag, attrs, html) {
  var e = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
  }
  if (html != null) e.innerHTML = html;
  return e;
}

function renderChampList(filterText) {
  var box = document.getElementById("champListBox");
  box.innerHTML = "";
  var f = (filterText || "").toLowerCase();
  CHAMP_LIST.forEach(function (c) {
    if (f && c.name.toLowerCase().indexOf(f) === -1) return;
    var a = el("a", { href: "javascript:void(0)", "data-id": c.id }, c.name);
    if (c.id === state.championId) a.className = "selected";
    a.onclick = function () { selectChampion(c.id); };
    box.appendChild(a);
  });
}

function selectChampion(id) {
  state.championId = id;
  state.overrides = {};
  ABIL_KEYS.forEach(function (k) { trackers[k] = null; });
  renderChampList(document.getElementById("champSearch").value);
  render();
}

function getRanks() {
  var champ = CHAMP_DATA[state.championId];
  var auto = computeAutoRanks(champ, state.level);
  var final = {};
  ABIL_KEYS.forEach(function (k) {
    final[k] = (state.overrides[k] != null) ? state.overrides[k] : auto[k];
  });
  return { auto: auto, final: final };
}

function render() {
  var main = document.getElementById("mainPanel");
  if (!state.championId) {
    main.innerHTML = '<div class="box"><div class="boxhead">&gt;&gt; No champion selected</div>' +
      '<div class="boxbody">Type a champion name in the search box, or pick one from the list on the left. ' +
      'Then set Champion Level and Ability Haste to see all four cooldowns update instantly. ' +
      'Once a champion is selected, click an ability\'s icon in the Track column to start counting down its cooldown &mdash; click it again to reset.</div></div>';
    return;
  }
  var champ = CHAMP_DATA[state.championId];
  var ranks = getRanks();

  var html = "";
  html += '<div class="champHeader">';
  html += '<span class="cname">' + champ.name + '</span> &nbsp; <span class="ctitle">' + champ.title + '</span>';
  html += '</div>';

  html += '<table class="abilities" cellspacing="0" cellpadding="0">';
  html += "<tr><th>Key</th><th>Ability</th><th>Rank</th><th>Base CD</th><th>Effective CD</th><th>Track</th></tr>";

  ABIL_KEYS.forEach(function (k, idx) {
    var a = champ.abilities[k];
    var maxRank = a.cooldown.length;
    var autoRank = ranks.auto[k];
    var finalRank = ranks.final[k];
    var rowClass = (idx % 2 === 0) ? "rowA" : "rowB";

    html += '<tr class="' + rowClass + '">';
    html += '<td class="abilKey">' + k + '</td>';
    html += '<td class="abilName">' + a.name + '</td>';

    // rank select
    html += '<td><select class="rankSelect" data-abil="' + k + '" onchange="onRankOverride(this)">';
    html += '<option value="auto">auto (' + (autoRank > 0 ? "rank " + autoRank : "not learned") + ')</option>';
    for (var r = 1; r <= maxRank; r++) {
      var sel = (state.overrides[k] === r) ? ' selected' : '';
      html += '<option value="' + r + '"' + sel + '>rank ' + r + '</option>';
    }
    html += '</select>';
    html += '<div class="' + (state.overrides[k] != null ? 'overrideTag' : 'autoTag') + '">' +
      (state.overrides[k] != null ? 'manual override' : 'estimated from level ' + state.level +
        (k !== 'R' ? ' &amp; skill order ' + champ.skillOrder.split('').join('&gt;') : '')) +
      '</div>';
    html += '</td>';

    if (finalRank < 1) {
      html += '<td class="cdCell notLearned">not learned</td>';
      html += '<td class="cdCell notLearned">&mdash;</td>';
      html += '<td class="trackCell">' + trackIconHtml(k, k, 0, true) + '</td>';
    } else {
      var base = a.cooldown[finalRank - 1];
      var fin = effectiveCooldown(base, state.haste);
      html += '<td class="cdCell"><span class="cdBase">' + base + 's</span></td>';
      html += '<td class="cdCell"><span class="cdFinal">' + formatSeconds(fin) + '</span> ' +
        '<span class="cdBase">(' + (Math.round(fin * 100) / 100) + 's)</span></td>';
      html += '<td class="trackCell">' + trackIconHtml(k, k, fin, false) + '</td>';
    }
    html += '</tr>';
  });

  html += '</table>';

  html += '<hr class="old">';
  html += '<div class="sourceNote">Base cooldowns: <a href="https://ddragon.leagueoflegends.com/" target="_blank">Riot Data Dragon (official game data), patch 16.16.1</a>, ' +
    'cross-referenced against <a href="https://wiki.leagueoflegends.com/en-us/" target="_blank">wiki.leagueoflegends.com</a>. ' +
    'Skill order (which ability is maxed first) is an estimate from current aggregate play data on ' +
    '<a href="https://u.gg/" target="_blank">u.gg</a>, <a href="https://mobalytics.gg/" target="_blank">Mobalytics</a> and ' +
    '<a href="https://op.gg/" target="_blank">op.gg</a> &mdash; override any ability\'s rank above if your build differs.</div>';
  html += '<div class="trackHint">Click an ability\'s Track icon when you see the enemy use it, to start counting down its cooldown. Click it again to reset if you misclicked.</div>';

  main.innerHTML = html;
  ABIL_KEYS.forEach(updateTrackIcon);
}

function populateSpellSelects() {
  ["spell1Select", "spell2Select"].forEach(function (elId) {
    var sel = document.getElementById(elId);
    sel.innerHTML = "";
    SUMMONER_SPELLS.forEach(function (s) {
      sel.appendChild(el("option", { value: s.id }, s.name));
    });
  });
  document.getElementById("spell1Select").value = state.spell1;
  document.getElementById("spell2Select").value = state.spell2;
}

function renderSummonerSpells() {
  var container = document.getElementById("summonerResults");
  var spellHaste = (state.lucidBoots ? 10 : 0) + (state.cosmicInsight ? 18 : 0);

  var html = '<table class="abilities" cellspacing="0" cellpadding="0" style="margin-top:8px;">';
  html += "<tr><th>Slot</th><th>Spell</th><th>Base CD</th><th>Effective CD</th><th>Track</th></tr>";

  var slotKeys = ["spell1", "spell2"];
  [state.spell1, state.spell2].forEach(function (spellId, idx) {
    var spell = SUMMONER_SPELLS.filter(function (s) { return s.id === spellId; })[0];
    var rowClass = (idx % 2 === 0) ? "rowA" : "rowB";
    var fin = effectiveCooldown(spell.cooldown, spellHaste);
    html += '<tr class="' + rowClass + '">';
    html += '<td class="abilKey">' + (idx + 1) + '</td>';
    html += '<td class="abilName">' + spell.name + '</td>';
    html += '<td class="cdCell"><span class="cdBase">' + spell.cooldown + 's</span></td>';
    html += '<td class="cdCell"><span class="cdFinal">' + formatSeconds(fin) + '</span> ' +
      '<span class="cdBase">(' + (Math.round(fin * 100) / 100) + 's)</span></td>';
    html += '<td class="trackCell">' + trackIconHtml(slotKeys[idx], spell.abbr, fin, false) + '</td>';
    html += '</tr>';
  });

  html += '</table>';
  html += '<div class="sourceNote" style="margin-top:4px;">Total summoner spell haste applied: ' + spellHaste + '</div>';
  html += '<div class="trackHint">Click a spell\'s Track icon when the enemy uses it, to start counting down its cooldown. Click it again to reset if you misclicked.</div>';

  container.innerHTML = html;
  updateTrackIcon("spell1");
  updateTrackIcon("spell2");
}

function onRankOverride(selectEl) {
  var abil = selectEl.getAttribute("data-abil");
  var val = selectEl.value;
  if (val === "auto") {
    delete state.overrides[abil];
  } else {
    state.overrides[abil] = parseInt(val, 10);
  }
  render();
}

function onLevelChange(v) {
  var lvl = parseInt(v, 10);
  if (isNaN(lvl)) lvl = 1;
  lvl = Math.max(1, Math.min(18, lvl));
  state.level = lvl;
  document.getElementById("levelInput").value = lvl;
  document.getElementById("levelSlider").value = lvl;
  render();
}

function onHasteChange(v) {
  var h = parseFloat(v);
  if (isNaN(h) || h < 0) h = 0;
  state.haste = h;
  document.getElementById("hasteInput").value = h;
  render();
}

window.onload = function () {
  renderChampList("");
  populateSpellSelects();

  document.getElementById("champSearch").addEventListener("input", function (e) {
    renderChampList(e.target.value);
  });
  document.getElementById("levelInput").addEventListener("input", function (e) {
    onLevelChange(e.target.value);
  });
  document.getElementById("levelSlider").addEventListener("input", function (e) {
    onLevelChange(e.target.value);
  });
  document.getElementById("hasteInput").addEventListener("input", function (e) {
    onHasteChange(e.target.value);
  });
  document.getElementById("spell1Select").addEventListener("change", function (e) {
    state.spell1 = e.target.value;
    trackers.spell1 = null;
    renderSummonerSpells();
  });
  document.getElementById("spell2Select").addEventListener("change", function (e) {
    state.spell2 = e.target.value;
    trackers.spell2 = null;
    renderSummonerSpells();
  });
  document.getElementById("lucidBootsCheck").addEventListener("change", function (e) {
    state.lucidBoots = e.target.checked;
    renderSummonerSpells();
  });
  document.getElementById("cosmicInsightCheck").addEventListener("change", function (e) {
    state.cosmicInsight = e.target.checked;
    renderSummonerSpells();
  });

  bindTrackClicks("mainPanel");
  bindTrackClicks("summonerResults");
  setInterval(tickTrackers, TRACK_TICK_MS);
  bindCollapseToggles();

  render();
  renderSummonerSpells();
};

function bindCollapseToggles() {
  document.addEventListener("click", function (e) {
    var head = e.target.closest(".boxhead");
    if (!head) return;
    var box = head.closest(".box");
    if (!box) return;
    box.classList.toggle("collapsed");
  });
}
