/* ================================================================
 *  📊 Kankor Dashboard v6.0 — Application Logic
 *  ================================================================
 *  Engine: Hybrid Constrained Regression Model
 *  Formula: Traz = β₀ + k × S_weighted
 *  Calibration: 2 data points (Qalam-Chi Jan 2026)
 *  Accuracy: ±150 traz
 *
 *  Author: Kankor Dashboard Team
 *  Last Updated: 2026-02-26
 * ================================================================ */


/* ────────────────────────────────────────────────────────────────
 *  📦 SECTION 1: Model Configuration (پارامترهای مدل)
 * ──────────────────────────────────────────────────────────────── */

/**
 * پارامترهای اصلی مدل رگرسیون
 * beta0: عرض از مبدأ (intercept)
 * k: شیب مدل (slope)
 * gradeWeights: وزن هر پایه تحصیلی در میانگین‌گیری
 */
const MODEL_CONFIG = {
    version: "6.0",
    beta0: 4350,
    k: 40,
    gradeWeights: {
        10: 1.0,   // پایه دهم: وزن ۱
        11: 1.5,   // پایه یازدهم: وزن ۱.۵
        12: 2.5,   // پایه دوازدهم: وزن ۲.۵ (بیشترین اهمیت)
    },
};


/* ────────────────────────────────────────────────────────────────
 *  📚 SECTION 2: Major Definitions (تعریف رشته‌ها و دروس)
 * ──────────────────────────────────────────────────────────────── */

/**
 * هر رشته شامل آرایه‌ای از دروس اختصاصی است
 * هر درس دارای:
 *   - name: نام فارسی
 *   - emoji: آیکون
 *   - konkur_weight: ضریب کنکور (وزن در نمره نهایی)
 *   - grades: پایه‌هایی که این درس رو دارن
 *   - color: رنگ پاستیلی برای UI
 *   - labels: برچسب هر پایه
 */
const MAJORS = {
    tajrobi: {
        name: "تجربی",
        emoji: "🧬",
        subjects: {
            biology: {
                name: "زیست‌شناسی",
                emoji: "🧬",
                konkur_weight: 3,
                grades: [10, 11, 12],
                color: "mint",
                labels: {
                    10: "زیست ۱ (دهم)",
                    11: "زیست ۲ (یازدهم)",
                    12: "زیست ۳ (دوازدهم)"
                }
            },
            physics: {
                name: "فیزیک",
                emoji: "⚡",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "sky",
                labels: {
                    10: "فیزیک ۱ (دهم)",
                    11: "فیزیک ۲ (یازدهم)",
                    12: "فیزیک ۳ (دوازدهم)"
                }
            },
            chemistry: {
                name: "شیمی",
                emoji: "🧪",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "lavender",
                labels: {
                    10: "شیمی ۱ (دهم)",
                    11: "شیمی ۲ (یازدهم)",
                    12: "شیمی ۳ (دوازدهم)"
                }
            },
            math: {
                name: "ریاضی",
                emoji: "📐",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "purple",
                labels: {
                    10: "ریاضی ۱ (دهم)",
                    11: "ریاضی ۲ (یازدهم)",
                    12: "ریاضی ۳ (دوازدهم)"
                }
            },
            geology: {
                name: "زمین‌شناسی",
                emoji: "🌍",
                konkur_weight: 1,
                grades: [11],
                color: "orange",
                labels: {
                    11: "زمین‌شناسی (یازدهم)"
                }
            },
        },
    },

    riazi: {
        name: "ریاضی فیزیک",
        emoji: "📐",
        subjects: {
            math: {
                name: "ریاضیات",
                emoji: "📐",
                konkur_weight: 3,
                grades: [10, 11, 12],
                color: "purple",
                labels: {
                    10: "ریاضی ۱ (دهم)",
                    11: "ریاضی ۲ (یازدهم)",
                    12: "ریاضی ۳ + گسسته + هندسه ۳ (دوازدهم)"
                }
            },
            physics: {
                name: "فیزیک",
                emoji: "⚡",
                konkur_weight: 3,
                grades: [10, 11, 12],
                color: "sky",
                labels: {
                    10: "فیزیک ۱ (دهم)",
                    11: "فیزیک ۲ (یازدهم)",
                    12: "فیزیک ۳ (دوازدهم)"
                }
            },
            chemistry: {
                name: "شیمی",
                emoji: "🧪",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "lavender",
                labels: {
                    10: "شیمی ۱ (دهم)",
                    11: "شیمی ۲ (یازدهم)",
                    12: "شیمی ۳ (دوازدهم)"
                }
            },
        },
    },

    ensani: {
        name: "علوم انسانی",
        emoji: "📖",
        subjects: {
            literature: {
                name: "ادبیات اختصاصی",
                emoji: "📝",
                konkur_weight: 3,
                grades: [10, 11, 12],
                color: "pink",
                labels: {
                    10: "ادبیات ۱ (دهم)",
                    11: "ادبیات ۲ (یازدهم)",
                    12: "ادبیات ۳ (دوازدهم)"
                }
            },
            arabic: {
                name: "عربی اختصاصی",
                emoji: "🕌",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "yellow",
                labels: {
                    10: "عربی ۱ (دهم)",
                    11: "عربی ۲ (یازدهم)",
                    12: "عربی ۳ (دوازدهم)"
                }
            },
            sociology: {
                name: "علوم اجتماعی",
                emoji: "👥",
                konkur_weight: 3,
                grades: [10, 11, 12],
                color: "blue",
                labels: {
                    10: "جامعه‌شناسی ۱ (دهم)",
                    11: "جامعه‌شناسی ۲ (یازدهم)",
                    12: "جامعه‌شناسی ۳ (دوازدهم)"
                }
            },
            history_geography: {
                name: "تاریخ و جغرافیا",
                emoji: "🗺️",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "orange",
                labels: {
                    10: "تاریخ/جغرافیا ۱ (دهم)",
                    11: "تاریخ/جغرافیا ۲ (یازدهم)",
                    12: "تاریخ/جغرافیا ۳ (دوازدهم)"
                }
            },
            math_stats: {
                name: "ریاضی و آمار",
                emoji: "📊",
                konkur_weight: 2,
                grades: [10, 11, 12],
                color: "purple",
                labels: {
                    10: "ریاضی و آمار ۱ (دهم)",
                    11: "ریاضی و آمار ۲ (یازدهم)",
                    12: "ریاضی و آمار ۳ (دوازدهم)"
                }
            },
            philosophy: {
                name: "فلسفه و منطق",
                emoji: "🤔",
                konkur_weight: 1,
                grades: [11, 12],
                color: "lavender",
                labels: {
                    11: "فلسفه (یازدهم)",
                    12: "فلسفه (دوازدهم)"
                }
            },
            psychology: {
                name: "روان‌شناسی",
                emoji: "🧠",
                konkur_weight: 1,
                grades: [11],
                color: "mint",
                labels: {
                    11: "روان‌شناسی (یازدهم)"
                }
            },
            economics: {
                name: "اقتصاد",
                emoji: "💰",
                konkur_weight: 1,
                grades: [11],
                color: "peach",
                labels: {
                    11: "اقتصاد (یازدهم)"
                }
            },
        },
    },
};


/* ────────────────────────────────────────────────────────────────
 *  🔧 SECTION 3: Application State (وضعیت اپلیکیشن)
 * ──────────────────────────────────────────────────────────────── */

/** رشته فعلی انتخاب‌شده (از localStorage بازیابی می‌شود) */
let currentField = localStorage.getItem('kd_selectedField') || null;


/* ────────────────────────────────────────────────────────────────
 *  📅 SECTION 4: Date Display (نمایش تاریخ شمسی)
 * ──────────────────────────────────────────────────────────────── */

/**
 * نمایش تاریخ جاری به شمسی در هدر
 */
function displayDate() {
    const el = document.getElementById('todayDate');
    if (!el) return;

    const now = new Date();
    el.textContent = '📅 ' + now.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


/* ────────────────────────────────────────────────────────────────
 *  🔘 SECTION 5: Field Selection (مدیریت انتخاب رشته)
 * ──────────────────────────────────────────────────────────────── */

/**
 * انتخاب رشته و آپدیت کل UI
 * @param {string} field - کلید رشته (tajrobi | riazi | ensani)
 */
function selectField(field) {
    currentField = field;
    localStorage.setItem('kd_selectedField', field);

    /* آپدیت استایل دکمه‌ها */
    document.querySelectorAll('.field-btn').forEach(btn => {
        const isActive = btn.dataset.field === field;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });

    /* ساخت پنل‌های دروس */
    renderSubjects(field);

    /* نمایش سکشن‌ها با انیمیشن */
    document.getElementById('subjectsSection').classList.add('visible');
    document.getElementById('actionsSection').classList.add('visible');
    document.getElementById('resultSection').classList.add('visible');

    /* ریست نتایج قبلی */
    resetResultPanel();

    /* بازیابی مقادیر ذخیره‌شده */
    restoreSavedValues();
}


/* ────────────────────────────────────────────────────────────────
 *  🃏 SECTION 6: Subject Panel Rendering (ساخت پنل‌های دروس)
 * ──────────────────────────────────────────────────────────────── */

/**
 * ساخت HTML پنل یک درس با اینپوت‌های پایه‌های تحصیلی
 * @param {string} subjectKey - کلید درس
 * @param {Object} subjectDef - تعریف درس شامل name, emoji, grades, labels, ...
 * @returns {string} HTML string
 */
function buildSubjectPanelHTML(subjectKey, subjectDef) {
    const gradeCount = subjectDef.grades.length;
    const gridClass = `grades-grid--${gradeCount}`;

    /* ساخت اینپوت هر پایه */
    const gradeInputsHTML = subjectDef.grades.map(grade => {
        const inputId = `input_${subjectKey}_${grade}`;
        const label = subjectDef.labels[grade] || `پایه ${grade}`;

        return `
            <div class="grade-input-group">
                <label class="grade-label" for="${inputId}">
                    <span class="grade-label__badge grade-label__badge--${grade}">${grade}</span>
                    ${label}
                </label>
                <div class="percent-input-wrapper">
                    <input
                        type="number"
                        class="percent-input"
                        id="${inputId}"
                        data-subject="${subjectKey}"
                        data-grade="${grade}"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="٪"
                        oninput="handleInput(this, '${subjectKey}')"
                        aria-label="درصد ${label}"
                    />
                    <span class="percent-symbol">%</span>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="subject-panel" data-color="${subjectDef.color}" data-subject="${subjectKey}">
            <div class="subject-panel__header">
                <div class="subject-panel__emoji">${subjectDef.emoji}</div>
                <div class="subject-panel__info">
                    <div class="subject-panel__name">${subjectDef.name}</div>
                    <div class="subject-panel__meta">ضریب کنکور: ${subjectDef.konkur_weight} &nbsp;|&nbsp; وزن پایه‌ها: ۱۰→۱ / ۱۱→۱.۵ / ۱۲→۲.۵</div>
                </div>
                <div class="subject-panel__avg" id="avg_${subjectKey}">—</div>
            </div>
            <div class="grades-grid ${gridClass}">
                ${gradeInputsHTML}
            </div>
            <div class="subject-panel__progress">
                <div class="subject-panel__progress-bar" id="progress_${subjectKey}"></div>
            </div>
        </div>
    `;
}

/**
 * رندر تمام پنل‌های دروس رشته انتخاب‌شده
 * @param {string} field - کلید رشته
 */
function renderSubjects(field) {
    const container = document.getElementById('subjectsContainer');
    const major = MAJORS[field];
    if (!major || !container) return;

    let html = '';
    for (const [key, def] of Object.entries(major.subjects)) {
        html += buildSubjectPanelHTML(key, def);
    }
    container.innerHTML = html;
}


/* ────────────────────────────────────────────────────────────────
 *  ⌨️ SECTION 7: Input Handling (مدیریت ورودی کاربر)
 * ──────────────────────────────────────────────────────────────── */

/**
 * هندلر تغییر هر اینپوت درصد
 * - اعتبارسنجی بازه 0-100
 * - فیدبک بصری (سبز/قرمز)
 * - ذخیره در localStorage
 * - آپدیت میانگین درس
 *
 * @param {HTMLInputElement} inputEl - عنصر اینپوت
 * @param {string} subjectKey - کلید درس
 */
function handleInput(inputEl, subjectKey) {
    let val = parseFloat(inputEl.value);

    /* کلمپ کردن بازه */
    if (val > 100) { inputEl.value = 100; val = 100; }
    if (val < 0)   { inputEl.value = 0;   val = 0;   }

    /* فیدبک بصری */
    inputEl.classList.remove('input--invalid', 'input--valid');
    if (inputEl.value !== '' && !isNaN(val)) {
        inputEl.classList.add('input--valid');
    }

    /* ذخیره‌سازی در localStorage */
    const grade = inputEl.dataset.grade;
    const storageKey = `kd_${subjectKey}_${grade}`;
    localStorage.setItem(storageKey, inputEl.value);

    /* آپدیت میانگین وزن‌دار درس */
    updateSubjectAvg(subjectKey);
}

/**
 * محاسبه و نمایش میانگین وزن‌دار یک درس در UI
 * @param {string} subjectKey - کلید درس
 */
function updateSubjectAvg(subjectKey) {
    if (!currentField) return;

    const def = MAJORS[currentField].subjects[subjectKey];
    if (!def) return;

    const scores = {};
    let hasAny = false;

    def.grades.forEach(grade => {
        const input = document.getElementById(`input_${subjectKey}_${grade}`);
        if (input && input.value !== '') {
            scores[grade] = parseFloat(input.value);
            hasAny = true;
        }
    });

    const avgEl = document.getElementById(`avg_${subjectKey}`);
    const barEl = document.getElementById(`progress_${subjectKey}`);

    if (!hasAny) {
        if (avgEl) avgEl.textContent = '—';
        if (barEl) barEl.style.width = '0%';
        return;
    }

    const avg = calcSubjectAverage(scores, def.grades);
    if (avgEl) avgEl.textContent = Math.round(avg) + '٪';
    if (barEl) barEl.style.width = Math.max(0, Math.min(100, avg)) + '%';
}


/* ────────────────────────────────────────────────────────────────
 *  💾 SECTION 8: Data Persistence (ذخیره و بازیابی)
 * ──────────────────────────────────────────────────────────────── */

/**
 * بازیابی مقادیر ذخیره‌شده از localStorage و پر کردن اینپوت‌ها
 */
function restoreSavedValues() {
    if (!currentField) return;
    const major = MAJORS[currentField];

    for (const [key, def] of Object.entries(major.subjects)) {
        def.grades.forEach(grade => {
            const storageKey = `kd_${key}_${grade}`;
            const saved = localStorage.getItem(storageKey);
            if (saved !== null && saved !== '') {
                const input = document.getElementById(`input_${key}_${grade}`);
                if (input) {
                    input.value = saved;
                    input.classList.add('input--valid');
                }
            }
        });
        /* آپدیت میانگین بعد از پر کردن اینپوت‌ها */
        updateSubjectAvg(key);
    }
}


/* ────────────────────────────────────────────────────────────────
 *  🧮 SECTION 9: Calculation Engine (هسته محاسباتی)
 * ──────────────────────────────────────────────────────────────── */

/**
 * دریافت وزن پایه تحصیلی از config
 * @param {number} grade - شماره پایه (10, 11, 12)
 * @returns {number} وزن پایه
 */
function getGradeWeight(grade) {
    return MODEL_CONFIG.gradeWeights[grade] || 1.0;
}

/**
 * میانگین وزن‌دار یک درس بر اساس نمرات پایه‌ها
 *
 * فرمول:
 *   P̄_j = Σ(α_g × P_g) / Σ(α_g)
 *   که α_g وزن پایه g و P_g درصد اون پایه‌ست
 *
 * @param {Object} scores - { grade: percentage }
 * @param {number[]} availableGrades - پایه‌های موجود [10, 11, 12]
 * @returns {number} میانگین وزن‌دار (0-100)
 */
function calcSubjectAverage(scores, availableGrades) {
    let numerator   = 0;
    let denominator = 0;

    for (const grade of availableGrades) {
        const p = (scores[grade] != null && !isNaN(scores[grade]))
            ? Math.max(0, Math.min(100, scores[grade]))
            : 0;
        const alpha = getGradeWeight(grade);
        numerator   += alpha * p;
        denominator += alpha;
    }

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * نمره نهایی وزن‌دار تمام دروس اختصاصی
 *
 * فرمول:
 *   S_weighted = Σ(w_j × P̄_j) / Σ(w_j)
 *   که w_j ضریب کنکور درس j و P̄_j میانگین وزن‌دار درس j
 *
 * @param {Object} subjectAverages - { subjectKey: average }
 * @param {Object} subjectDefs - تعریف دروس
 * @returns {number} نمره وزن‌دار نهایی (0-100)
 */
function calcWeightedScore(subjectAverages, subjectDefs) {
    let numerator   = 0;
    let denominator = 0;

    for (const [key, def] of Object.entries(subjectDefs)) {
        const w   = def.konkur_weight;
        const avg = subjectAverages[key] || 0;
        numerator   += w * avg;
        denominator += w;
    }

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * سطح‌بندی تراز (7 سطح از L0 تا L5+)
 * @param {number} traz - تراز محاسبه‌شده
 * @returns {Object} اطلاعات سطح شامل name, emoji, university, league
 */
function getLevel(traz) {
    const levels = [
        { min: 7500, name: "L5+", emoji: "👑", university: "پزشکی تهران / شهید بهشتی",  league: "لیگ خدایان ⚡"   },
        { min: 7000, name: "L5",  emoji: "🏆", university: "پزشکی شهید بهشتی / تهران",  league: "لیگ خدایان ⚡"   },
        { min: 6700, name: "L4+", emoji: "🥇", university: "پزشکی شیراز / اصفهان",      league: "لیگ قهرمانان 🌟" },
        { min: 6400, name: "L4",  emoji: "🎯", university: "پزشکی مشهد / تبریز",        league: "لیگ قهرمانان 🌟" },
        { min: 6200, name: "L3",  emoji: "🔥", university: "پزشکی کرمان / گیلان",       league: "لیگ حرفه‌ای 💪"  },
        { min: 6000, name: "L2",  emoji: "📈", university: "پزشکی اهواز / همدان",       league: "لیگ صعود 🚀"    },
        { min: 5700, name: "L1",  emoji: "🌱", university: "پزشکی آزاد / سایر",         league: "لیگ شروع 🌱"    },
        { min: 0,    name: "L0",  emoji: "⚪", university: "نیاز به تلاش بیشتر",         league: "پیش‌فصل ⚪"     },
    ];

    for (const level of levels) {
        if (traz >= level.min) return level;
    }
    return levels[levels.length - 1];
}

/**
 * ماشین حساب معکوس: چقدر نمره لازمه برای رسیدن به تراز هدف؟
 * @param {number} targetTraz - تراز هدف
 * @returns {number} نمره وزن‌دار مورد نیاز (0-100)
 */
function requiredScoreForTraz(targetTraz) {
    const required = (targetTraz - MODEL_CONFIG.beta0) / MODEL_CONFIG.k;
    return Math.max(0, Math.min(100, Math.round(required * 100) / 100));
}

/**
 * 🎯 تابع اصلی محاسبه تراز
 * تمام مراحل رو از خوندن اینپوت‌ها تا خروجی نهایی اجرا می‌کنه
 *
 * @param {string} majorKey - کلید رشته
 * @returns {Object|null} نتیجه شامل traz, weightedScore, level, details, ...
 */
function calculateTraz(majorKey) {
    const major = MAJORS[majorKey];
    if (!major) return null;

    const subjectDefs     = major.subjects;
    const subjectAverages = {};
    const details         = {};

    /* ───── قدم ۱: میانگین وزن‌دار هر درس ───── */
    for (const [key, def] of Object.entries(subjectDefs)) {
        const scores = {};

        def.grades.forEach(grade => {
            const input = document.getElementById(`input_${key}_${grade}`);
            if (input && input.value !== '') {
                scores[grade] = parseFloat(input.value);
            }
        });

        const avg = calcSubjectAverage(scores, def.grades);
        subjectAverages[key] = avg;

        details[key] = {
            name:            def.name,
            emoji:           def.emoji,
            konkur_weight:   def.konkur_weight,
            weightedAverage: Math.round(avg * 100) / 100,
            contribution:    Math.round(def.konkur_weight * avg * 100) / 100,
        };
    }

    /* ───── قدم ۲: نمره وزن‌دار نهایی ───── */
    const weightedScore = calcWeightedScore(subjectAverages, subjectDefs);

    /* ───── قدم ۳: فرمول تراز ───── */
    const traz        = MODEL_CONFIG.beta0 + MODEL_CONFIG.k * weightedScore;
    const trazRounded = Math.round(traz);

    /* ───── قدم ۴: سطح‌بندی ───── */
    const level = getLevel(trazRounded);

    return {
        major:           major.name,
        majorEmoji:      major.emoji,
        traz:            trazRounded,
        weightedScore:   Math.round(weightedScore * 100) / 100,
        level,
        subjectAverages,
        details,
        formula: `${MODEL_CONFIG.beta0} + ${MODEL_CONFIG.k} × ${Math.round(weightedScore * 100) / 100}`,
    };
}


/* ────────────────────────────────────────────────────────────────
 *  📊 SECTION 10: Result Rendering (رندر نتایج)
 * ──────────────────────────────────────────────────────────────── */

/**
 * اجرای محاسبه و نمایش نتیجه
 */
function runCalculation() {
    if (!currentField) {
        showToast('🎓 اول رشته‌ات رو انتخاب کن!');
        return;
    }

    const result = calculateTraz(currentField);
    if (!result) return;

    renderResult(result);

    /* اسکرول نرم به بخش نتایج */
    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 200);
}

/**
 * رندر نتایج در بنتو گرید
 * @param {Object} result - خروجی calculateTraz
 */
function renderResult(result) {
    const bento = document.getElementById('resultBento');
    if (!bento) return;

    const level = result.level;

    /* ───── تارگت‌های مقایسه‌ای ───── */
    const targets = [
        { name: "L1 — پزشکی آزاد",            traz: 5700 },
        { name: "L2 — پزشکی اهواز/همدان",     traz: 6000 },
        { name: "L3 — پزشکی کرمان/گیلان",     traz: 6200 },
        { name: "L4 — پزشکی مشهد/تبریز",      traz: 6400 },
        { name: "L4+ — پزشکی شیراز/اصفهان",   traz: 6700 },
        { name: "L5 — پزشکی تهران/بهشتی",     traz: 7000 },
    ];

    const targetsHTML = targets.map(t => {
        const diff = t.traz - result.traz;
        let statusClass, statusText;

        if (diff <= 0) {
            statusClass = 'target-status--reached';
            statusText  = '✅ رسیدی!';
        } else if (diff <= 300) {
            statusClass = 'target-status--close';
            statusText  = `⬆️ +${diff} تراز`;
        } else {
            statusClass = 'target-status--far';
            statusText  = `⬆️ +${diff} تراز`;
        }

        return `
            <div class="target-row">
                <span class="target-name">${t.name}</span>
                <span class="target-status ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');

    /* ───── جزئیات هر درس ───── */
    const detailsHTML = Object.entries(result.details).map(([key, d]) => {
        return `
            <div class="detail-row">
                <span class="detail-subject">
                    ${d.emoji} ${d.name}
                    <small style="color:var(--text-muted)">(×${d.konkur_weight})</small>
                </span>
                <span class="detail-avg">${d.weightedAverage}٪</span>
            </div>
        `;
    }).join('');

    /* ───── ساخت HTML نهایی بنتو ───── */
    bento.innerHTML = `
        <!-- 🏆 کارت تراز اصلی -->
        <div class="result-card--main">
            <div class="result-label">${result.majorEmoji} تراز تخمینی رشته ${result.major}</div>
            <div class="result-traz-big">${result.traz}</div>
            <div class="result-formula">${result.formula} = ${result.traz}</div>
        </div>

        <!-- 📏 نمره وزن‌دار -->
        <div class="result-card--small">
            <div class="result-small-label">📏 نمره وزن‌دار</div>
            <div class="result-small-value">${result.weightedScore}</div>
            <div class="result-small-sub">از ۱۰۰</div>
        </div>

        <!-- 🎖️ سطح -->
        <div class="result-card--small">
            <div class="result-small-label">🎖️ سطح</div>
            <div class="result-small-value">${level.emoji} ${level.name}</div>
            <div class="result-small-sub">${level.league}</div>
        </div>

        <!-- 🏛️ لیگ و دانشگاه -->
        <div class="result-card--league">
            <div class="league-info">
                <span class="league-emoji">${level.emoji}</span>
                <div class="league-details">
                    <span class="league-name">${level.league}</span>
                    <span class="league-university">🏛️ ${level.university}</span>
                </div>
            </div>
            <span class="league-badge">${level.name}</span>
        </div>

        <!-- 📋 جزئیات دروس -->
        <div class="result-card--details">
            <div class="details-title">📋 میانگین وزن‌دار هر درس</div>
            ${detailsHTML}
        </div>

        <!-- 🎯 تحلیل فاصله تا اهداف -->
        <div class="result-card--targets">
            <div class="targets-title">🎯 فاصله تا اهداف</div>
            ${targetsHTML}
        </div>
    `;
}

/**
 * ریست پنل نتایج به حالت اولیه (placeholder)
 */
function resetResultPanel() {
    const bento = document.getElementById('resultBento');
    if (!bento) return;

    bento.innerHTML = `
        <div class="result-placeholder">
            <div class="result-placeholder__icon">🎯</div>
            <div class="result-placeholder__text">درصدها رو وارد کن و دکمه «محاسبه تراز» رو بزن!</div>
        </div>
    `;
}


/* ────────────────────────────────────────────────────────────────
 *  📸 SECTION 11: PNG Export (خروجی تصویری)
 * ──────────────────────────────────────────────────────────────── */

/**
 * گرفتن اسکرین‌شات از کل اپ و دانلود به صورت PNG
 * از کتابخانه html2canvas استفاده می‌کنه
 */
function exportPNG() {
    if (!currentField) {
        showToast('🎓 اول رشته‌ات رو انتخاب کن!');
        return;
    }

    showToast('📸 در حال گرفتن اسکرین‌شات...');

    const target = document.getElementById('appWrapper');

    html2canvas(target, {
        scale: 2,                       // کیفیت ۲ برابر
        useCORS: true,                  // پشتیبانی فونت‌های خارجی
        backgroundColor: '#F8F6F2',     // رنگ پس‌زمینه ثابت
        logging: false,                 // بدون لاگ در کنسول
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
    }).then(canvas => {
        /* ساخت لینک دانلود */
        const link = document.createElement('a');
        const fieldName = MAJORS[currentField]?.name || 'taraz';
        link.download = `taraz-qalamchi-${fieldName}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showToast('✅ تصویر دانلود شد!');
    }).catch(err => {
        console.error('[ExportPNG] Error:', err);
        showToast('❌ خطا در ساخت تصویر!');
    });
}


/* ────────────────────────────────────────────────────────────────
 *  🗑️ SECTION 12: Reset (پاک‌سازی کامل)
 * ──────────────────────────────────────────────────────────────── */

/**
 * پاک‌سازی تمام داده‌ها: اینپوت‌ها، localStorage و نتایج
 */
function resetAll() {
    if (!confirm('🗑️ همه درصدها پاک بشن؟')) return;

    /* پاک‌سازی localStorage برای تمام رشته‌ها */
    for (const [majorKey, major] of Object.entries(MAJORS)) {
        for (const [subKey, def] of Object.entries(major.subjects)) {
            def.grades.forEach(grade => {
                localStorage.removeItem(`kd_${subKey}_${grade}`);
            });
        }
    }

    /* ریست اینپوت‌ها */
    document.querySelectorAll('.percent-input').forEach(input => {
        input.value = '';
        input.classList.remove('input--valid', 'input--invalid');
    });

    /* ریست میانگین‌ها */
    document.querySelectorAll('[id^="avg_"]').forEach(el => {
        el.textContent = '—';
    });

    /* ریست نوارهای پیشرفت */
    document.querySelectorAll('[id^="progress_"]').forEach(el => {
        el.style.width = '0%';
    });

    /* ریست نتایج */
    resetResultPanel();

    showToast('🗑️ همه چیز پاک شد!');
}


/* ────────────────────────────────────────────────────────────────
 *  🍞 SECTION 13: Toast Notification (اعلان‌های زودگذر)
 * ──────────────────────────────────────────────────────────────── */

/**
 * نمایش پیام Toast در پایین صفحه
 * @param {string} message - متن پیام
 */
function showToast(message) {
    /* حذف toast قبلی */
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;

    /* استایل‌دهی inline (بخشی از JS بودن ماهیتاً) */
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        padding: 12px 24px;
        border-radius: 16px;
        background: rgba(45, 45, 58, 0.9);
        backdrop-filter: blur(12px);
        color: #fff;
        font-family: 'Vazirmatn', sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        pointer-events: none;
    `;

    document.body.appendChild(toast);

    /* انیمیشن ورود */
    requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    /* حذف بعد از ۲.۵ ثانیه */
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}


/* ────────────────────────────────────────────────────────────────
 *  🚀 SECTION 14: Initialization (بوت‌استرپ اولیه)
 * ──────────────────────────────────────────────────────────────── */

/**
 * اجرای اولیه اپلیکیشن
 * - نمایش تاریخ
 * - بازیابی رشته ذخیره‌شده
 */
(function init() {
    displayDate();

    /* اگه قبلاً رشته انتخاب شده بود، بازیابیش کن */
    if (currentField && MAJORS[currentField]) {
        selectField(currentField);
    }
})();
