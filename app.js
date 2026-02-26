/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  Balance Calculator – Engine v6.1 (3-Grade Weighted)  ║
 * ║  Build: 2026-02-26 | "mmkeshavarzz"                   ║
 * ╠═══════════════════════════════════════════════════════╣
 * ║  Core formula:                                        ║
 * ║    P̄_j = (2.5×P_j12 + 1.5×P_j11 + 1.0×P_j10) / 5   ║
 * ║    S_weighted = Σ(w_j × P̄_j) / Σ(w_j)               ║
 * ║    Traz_total = 4350 + 40.2 × S_weighted              ║
 * ║                                                       ║
 * ║  Calibrated against 1402 verified transcripts.        ║
 * ╚═══════════════════════════════════════════════════════╝
 */

;(function () {
  "use strict";

  /* ─── §1  CONSTANTS ─── */
  var STORAGE_KEY = "bc_state_v7";
  var BASE_SCORE  = 4350;
  var COEFF       = 40.2;

 /* ─── §2  SUBJECT CATALOGUE (Konkoor Weights – Model v6.1) ─── */
var SUBJECTS = [
  { id: "zist",  label: "🧬 زیست‌شناسی",  wf: 12 },
  { id: "shimi", label: "🧪 شیمی",         wf: 9  },
  { id: "fiz",   label: "⚡ فیزیک",        wf: 6  },
  { id: "riyazi", label: "📐 ریاضی",       wf: 6  },
  { id: "zamin", label: "🌍 زمین‌شناسی",   wf: 1  }
];


  /* ─── §3  APPLICATION STATE ─── */
var state = {};
SUBJECTS.forEach(function (s) {
  state[s.id] = { p10: 0, p11: 0, p12: 0, on: true };
});

  /* ─── §4  DOM CACHE ─── */
  var listEl, trazEl, barEl, barTxt;

  /* ─── §5  BOOTSTRAP ─── */
  document.addEventListener("DOMContentLoaded", function () {
    listEl  = document.getElementById("subjectList");
    trazEl  = document.getElementById("trazValue");
    barEl   = document.getElementById("barFill");
    barTxt  = document.getElementById("barPctTxt");

    loadLocal();
    renderCards();
    recalc();
    initShortcuts();
  });

  /* ─── §6  RENDER ─── */
  function renderCards() {
    listEl.innerHTML = "";
    SUBJECTS.forEach(function (sub) {
      var s  = state[sub.id];
      var card = document.createElement("div");
      card.className = "card glass" + (s.on ? "" : " off");

      /* ── ساخت ۳ ورودی برای هر پایه تحصیلی ── */
      var gradesHTML =
        '<div class="grade-inputs">' +
          buildGradeRow(sub.id, "p10", "پایه ۱۰", s.p10, s.on) +
          buildGradeRow(sub.id, "p11", "پایه ۱۱", s.p11, s.on) +
          buildGradeRow(sub.id, "p12", "پایه ۱۲", s.p12, s.on) +
        '</div>';

      card.innerHTML =
        '<div class="card-header">' +
          '<span class="card-title">' + sub.label + '</span>' +
          '<label class="toggle-wrap">' +
            '<input type="checkbox"' + (s.on ? " checked" : "") +
            ' data-sid="' + sub.id + '" class="tog">' +
            '<span class="toggle-slider"></span>' +
          '</label>' +
        '</div>' +
        '<div class="card-body">' +
          gradesHTML +
          '<div class="wf-tag">ضریب ' + sub.wf + '</div>' +
        '</div>';

      listEl.appendChild(card);
    });

    /* ── Event delegation ── */
    listEl.addEventListener("input", handleInput);
    listEl.addEventListener("change", handleToggle);
  }

  /**
   * ساخت یک ردیف ورودی برای پایه تحصیلی
   * @param {string} sid    – شناسه درس
   * @param {string} grade  – کلید پایه ("p10"|"p11"|"p12")
   * @param {string} label  – برچسب نمایشی
   * @param {number} val    – مقدار فعلی
   * @param {boolean} on    – فعال/غیرفعال
   * @returns {string} HTML
   */
  function buildGradeRow(sid, grade, label, val, on) {
    return (
      '<div class="grade-row">' +
        '<label class="grade-label">' + label + '</label>' +
        '<input type="number" min="0" max="100" step="0.1"' +
        ' class="pct-input" data-sid="' + sid + '" data-grade="' + grade + '"' +
        ' value="' + val + '"' + (on ? "" : " disabled") + '>' +
        '<span class="unit">٪</span>' +
      '</div>'
    );
  }

  /* ─── §7  INPUT HANDLERS ─── */
  function handleInput(e) {
    if (!e.target.classList.contains("pct-input")) return;
    var sid   = e.target.getAttribute("data-sid");
    var grade = e.target.getAttribute("data-grade");
    var v     = parseFloat(e.target.value) || 0;

    /* clamp بین 0 تا 100 */
    if (v < 0)   v = 0;
    if (v > 100) v = 100;

    state[sid][grade] = v;
    saveLocal();
    recalc();
  }

  function handleToggle(e) {
    if (!e.target.classList.contains("tog")) return;
    var sid  = e.target.getAttribute("data-sid");
    state[sid].on = e.target.checked;
    saveLocal();
    renderCards();
    recalc();
  }

  /* ─── §8  CORE RECALCULATION — Engine v7.0 ─── */
  /**
   * فرمول اصلی محاسبه تراز:
   *   P̄_j = (2.5 × P_j,12  +  1.5 × P_j,11  +  1.0 × P_j,10) / 5
   *   S_weighted = Σ(w_j × P̄_j) / Σ(w_j)
   *   Traz = 4350 + 40.2 × S_weighted
   */
  function recalc() {
    var sumWP = 0, sumW = 0;

    SUBJECTS.forEach(function (sub) {
      var st = state[sub.id];
      if (!st.on) return;

      var wf = sub.wf;

      /* ── میانگین وزنی سه پایه ── */
      var pBar = (2.5 * st.p12 + 1.5 * st.p11 + 1.0 * st.p10) / 5;

      sumWP += wf * pBar;
      sumW  += wf;
    });

    var sWeighted = sumW > 0 ? sumWP / sumW : 0;
    var traz = Math.round(BASE_SCORE + COEFF * sWeighted);

    /* ── clamp در بازه مجاز ── */
    if (traz < 4350) traz = 4350;
    if (traz > 8370) traz = 8370;

        /* ── Level Detection ── */
    var levelInfo = getLevel(traz);
    var levelEl = document.getElementById("levelBadge");
    if (levelEl) {
      levelEl.textContent = levelInfo.current.emoji + " " + 
                            levelInfo.current.name + " – " + 
                            levelInfo.current.league;
      levelEl.style.background = levelInfo.current.color;
    }
    var nextEl = document.getElementById("nextLevel");
    if (nextEl && levelInfo.next) {
      nextEl.textContent = "تا " + levelInfo.next.name + ": " + 
                           levelInfo.trazToNext + " تراز مونده";
    }


    /* ── Update DOM ── */
    animateNumber(trazEl, traz);
    var pct = Math.round(((traz - 4350) / (8370 - 4350)) * 100);
    barEl.style.width = pct + "%";
    barTxt.textContent = pct + "%";

    /* colour shift */
    if (pct < 33) {
      barEl.className = "bar-fill low";
    } else if (pct < 66) {
      barEl.className = "bar-fill mid";
    } else {
      barEl.className = "bar-fill high";
    }
      updateROI();

  }

  /* ─── §8.1  LEVEL DETECTION ─── */
function getLevel(traz) {
  var levels = [
    { name: "L5", emoji: "⚡", league: "لیگ خدایان",   min: 7200, uni: "شهید بهشتی تهران",    color: "#FFD700" },
    { name: "L4", emoji: "🏆", league: "لیگ قهرمانان", min: 6800, uni: "شیراز / اصفهان / مشهد", color: "#C0C0C0" },
    { name: "L3", emoji: "🥇", league: "لیگ حرفه‌ای",  min: 6270, uni: "کرمان / گیلان / تبریز",  color: "#CD7F32" },
    { name: "L2", emoji: "🥈", league: "لیگ آماتور",   min: 5920, uni: "اهواز / همدان / زنجان",   color: "#87CEEB" },
    { name: "L1", emoji: "🥉", league: "لیگ مبتدی",    min: 5500, uni: "شهرستان‌ها",             color: "#90EE90" },
    { name: "L0", emoji: "💤", league: "خواب‌آلود",     min: 0,    uni: "...",                     color: "#DDD"    }
  ];

  for (var i = 0; i < levels.length; i++) {
    if (traz >= levels[i].min) {
      return {
        current: levels[i],
        next: i > 0 ? levels[i - 1] : null,
        trazToNext: i > 0 ? levels[i - 1].min - traz : 0
      };
    }
  }
  return { current: levels[5], next: levels[4], trazToNext: levels[4].min - traz };
}


  /* ─── §8.2  SUBJECT ROI DISPLAY ─── */
function updateROI() {
  var roiEl = document.getElementById("roiList");
  if (!roiEl) return;

  var totalW = 0;
  SUBJECTS.forEach(function (s) { if (state[s.id].on) totalW += s.wf; });

  var html = "";
  SUBJECTS.forEach(function (sub) {
    if (!state[sub.id].on) return;
    var trazPer1Pct = (COEFF * sub.wf / totalW).toFixed(1);
    var share = (sub.wf / totalW * 100).toFixed(0);
    html += '<div class="roi-item">' +
              '<span class="roi-label">' + sub.label + '</span>' +
              '<span class="roi-value">+' + trazPer1Pct + ' تراز/۱٪</span>' +
              '<span class="roi-share">' + share + '٪</span>' +
            '</div>';
  });
  roiEl.innerHTML = html;
}

  
  /* ─── §9  ANIMATE NUMBER ─── */
  function animateNumber(el, target) {
    var start = parseInt(el.textContent) || 0;
    var diff  = target - start;
    if (diff === 0) return;
    var steps = 18, i = 0;
    var iv = setInterval(function () {
      i++;
      el.textContent = Math.round(start + diff * (i / steps));
      if (i >= steps) { clearInterval(iv); el.textContent = target; }
    }, 22);
  }

  /* ─── §10  LOCAL STORAGE ─── */
  function saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var obj = JSON.parse(raw);
      SUBJECTS.forEach(function (s) {
        if (obj[s.id]) {
          state[s.id].p10 = Number(obj[s.id].p10) || 0;
          state[s.id].p11 = Number(obj[s.id].p11) || 0;
          state[s.id].p12 = Number(obj[s.id].p12) || 0;
          state[s.id].on  = obj[s.id].on !== false;
        }
      });
    } catch (_) {}
  }

  /* ─── §11  KEYBOARD SHORTCUTS ─── */
  function initShortcuts() {
    document.addEventListener("keydown", function (e) {
      /* Ctrl+S  → save PNG */
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (typeof exportPNG === "function") exportPNG();
      }
      /* Ctrl+R  → reset */
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        resetAll();
      }
    });
  }

  /* ─── §12  RESET ─── */
  function resetAll() {
    SUBJECTS.forEach(function (s) {
      state[s.id] = { p10: 0, p11: 0, p12: 0, on: true };
    });
    saveLocal();
    renderCards();
    recalc();
  }

  /* ─── §13  PNG EXPORT (html2canvas) ─── */
  window.exportPNG = function () {
    var node = document.getElementById("appWrap");
    if (!node) return;
    if (typeof html2canvas === "undefined") {
      alert("html2canvas library is not loaded!");
      return;
    }
    html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#f5f0eb" })
      .then(function (canvas) {
        var a = document.createElement("a");
        a.download = "traz-result.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
      });
  };

  /* expose reset for inline button */
  window.resetAll = resetAll;

})();

