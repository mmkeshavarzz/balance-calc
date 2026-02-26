/* ================================================================
 *  📊 Kankor Dashboard v1.2.0 — Application Logic
 *  ================================================================
 *  Engine: Hybrid Constrained Regression Model
 *  Formula: Traz = β₀ + k × S_weighted
 *  
 *  NEW in v1.2.0:
 *    - Toggle subject ON/OFF (exclude from calculation)
 *    - Toggle individual grade ON/OFF
 *    - Persistent toggle state in localStorage
 *
 *  Author: Kankor Dashboard Team
 *  Last Updated: 2026-02-26
 * ================================================================ */


/* ────────────────────────────────────────────────────────────────
 *  📦 SECTION 1: Model Configuration (پارامترهای مدل)
 * ──────────────────────────────────────────────────────────────── */

const MODEL_CONFIG = {
    version: "6.1",
    beta0: 4350,
    k: 40,
    gradeWeights: {
        10: 1.0,
        11: 1.5,
        12: 2.5,
    },
};


/* ────────────────────────────────────────────────────────────────
 *  📚 SECTION 2: Major Definitions (تعریف رشته‌ها و دروس)
 * ──────────────────────────────────────────────────────────────── */

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

let currentField = localStorage.getItem('kd_selectedField') || null;


/* ────────────────────────────────────────────────────────────────
 *  📅 SECTION 4: Date Display (نمایش تاریخ شمسی)
 * ──────────────────────────────────────────────────────────────── */

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

function selectField(field) {
    currentField = field;
    localStorage.setItem('kd_selectedField', field);

    document.querySelectorAll('.field-btn').forEach(btn => {
        const isActive = btn.dataset.field === field;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });

    renderSubjects(field);

    document.getElementById('subjectsSection').classList.add('visible');
    document.getElementById('actionsSection').classList.add('visible');
    document.getElementById('resultSection').classList.add('visible');

    resetResultPanel();
    restoreSavedValues();
    restoreToggleStates();
}


/* ────────────────────────────────────────────────────────────────
 *  🃏 SECTION 6: Subject Panel Rendering (ساخت پنل‌های دروس)
 * ──────────────────────────────────────────────────────────────── */

/**
 * ساخت HTML تاگل سوئیچ
 * @param {string} id - آی‌دی یونیک
 * @param {boolean} checked - وضعیت پیش‌فرض
 * @param {string} extraClass - کلاس اضافی
 * @param {string} onChange - رویداد onchange
 * @param {string} labelText - متن لیبل (اختیاری)
 * @returns {string} HTML string
 */
function buildToggleHTML(id, checked, extraClass, onChange, labelText = '') {
    return `
        <label class="toggle-switch ${extraClass}" title="${labelText || 'فعال/غیرفعال'}">
            <input
                type="checkbox"
                class="toggle-switch__input"
                id="${id}"
                ${checked ? 'checked' : ''}
                onchange="${onChange}"
            />
            <span class="toggle-switch__slider"></span>
            ${labelText ? `<span class="toggle-switch__label-text">${labelText}</span>` : ''}
        </label>
    `;
}

/**
 * ساخت HTML پنل یک درس با تاگل‌های خاموش/روشن
 */
function buildSubjectPanelHTML(subjectKey, subjectDef) {
    const gradeCount = subjectDef.grades.length;
    const gridClass = `grades-grid--${gradeCount}`;

    /* تاگل کل درس */
    const subjectToggleId = `toggle_subject_${subjectKey}`;
    const subjectToggleHTML = buildToggleHTML(
        subjectToggleId,
        true,
        'toggle-subject',
        `toggleSubject('${subjectKey}')`,
        ''
    );

    /* ساخت اینپوت هر پایه + تاگل پایه */
    const gradeInputsHTML = subjectDef.grades.map(grade => {
        const inputId     = `input_${subjectKey}_${grade}`;
        const toggleId    = `toggle_grade_${subjectKey}_${grade}`;
        const label       = subjectDef.labels[grade] || `پایه ${grade}`;

        const gradeToggleHTML = buildToggleHTML(
            toggleId,
            true,
            'toggle-grade',
            `toggleGrade('${subjectKey}', ${grade})`,
            ''
        );

        return `
            <div class="grade-input-group" id="gradeGroup_${subjectKey}_${grade}">
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
                ${gradeToggleHTML}
            </div>
        `;
    }).join('');

    return `
        <div class="subject-panel" data-color="${subjectDef.color}" data-subject="${subjectKey}" id="panel_${subjectKey}">
            <div class="subject-panel__header">
                <div class="subject-panel__emoji">${subjectDef.emoji}</div>
                <div class="subject-panel__info">
                    <div class="subject-panel__name">${subjectDef.name}</div>
                    <div class="subject-panel__meta">ضریب: ${subjectDef.konkur_weight} &nbsp;|&nbsp; وزن: ۱۰→۱ / ۱۱→۱.۵ / ۱۲→۲.۵</div>
                </div>
                <div class="subject-panel__avg" id="avg_${subjectKey}">—</div>
                ${subjectToggleHTML}
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
 *  🔘 SECTION 7: Toggle Logic (منطق خاموش/روشن)
 * ──────────────────────────────────────────────────────────────── */

/**
 * خاموش/روشن کردن کل یک درس
 * وقتی خاموشه، کل پنل محو و غیرفعال میشه
 * و از محاسبه تراز حذف میشه
 *
 * @param {string} subjectKey - کلید درس
 */
function toggleSubject(subjectKey) {
    const checkbox = document.getElementById(`toggle_subject_${subjectKey}`);
    const panel    = document.getElementById(`panel_${subjectKey}`);
    if (!checkbox || !panel) return;

    const isEnabled = checkbox.checked;

    /* آپدیت ظاهری پنل */
    panel.classList.toggle('panel--disabled', !isEnabled);

    /* ذخیره وضعیت */
    localStorage.setItem(`kd_toggle_subject_${subjectKey}`, isEnabled ? '1' : '0');

    /* آپدیت میانگین */
    updateSubjectAvg(subjectKey);
}

/**
 * خاموش/روشن کردن یک پایه خاص از یک درس
 * فقط اون پایه از محاسبه حذف میشه
 *
 * @param {string} subjectKey - کلید درس
 * @param {number} grade - شماره پایه (10, 11, 12)
 */
function toggleGrade(subjectKey, grade) {
    const checkbox   = document.getElementById(`toggle_grade_${subjectKey}_${grade}`);
    const gradeGroup = document.getElementById(`gradeGroup_${subjectKey}_${grade}`);
    if (!checkbox || !gradeGroup) return;

    const isEnabled = checkbox.checked;

    /* آپدیت ظاهری */
    gradeGroup.classList.toggle('grade--disabled', !isEnabled);

    /* ذخیره وضعیت */
    localStorage.setItem(`kd_toggle_grade_${subjectKey}_${grade}`, isEnabled ? '1' : '0');

    /* آپدیت میانگین */
    updateSubjectAvg(subjectKey);
}

/**
 * چک کردن فعال بودن کل درس
 * @param {string} subjectKey
 * @returns {boolean}
 */
function isSubjectEnabled(subjectKey) {
    const checkbox = document.getElementById(`toggle_subject_${subjectKey}`);
    return checkbox ? checkbox.checked : true;
}

/**
 * چک کردن فعال بودن یک پایه خاص
 * @param {string} subjectKey
 * @param {number} grade
 * @returns {boolean}
 */
function isGradeEnabled(subjectKey, grade) {
    const checkbox = document.getElementById(`toggle_grade_${subjectKey}_${grade}`);
    return checkbox ? checkbox.checked : true;
}

/**
 * بازیابی وضعیت تاگل‌ها از localStorage و اعمال روی UI
 */
function restoreToggleStates() {
    if (!currentField) return;
    const major = MAJORS[currentField];

    for (const [key, def] of Object.entries(major.subjects)) {
        /* بازیابی تاگل کل درس */
        const subjectState = localStorage.getItem(`kd_toggle_subject_${key}`);
        if (subjectState === '0') {
            const checkbox = document.getElementById(`toggle_subject_${key}`);
            if (checkbox) {
                checkbox.checked = false;
                toggleSubject(key);
            }
        }

        /* بازیابی تاگل هر پایه */
        def.grades.forEach(grade => {
            const gradeState = localStorage.getItem(`kd_toggle_grade_${key}_${grade}`);
            if (gradeState === '0') {
                const checkbox = document.getElementById(`toggle_grade_${key}_${grade}`);
                if (checkbox) {
                    checkbox.checked = false;
                    toggleGrade(key, grade);
                }
            }
        });
    }
}


/* ────────────────────────────────────────────────────────────────
 *  ⌨️ SECTION 8: Input Handling (مدیریت ورودی کاربر)
 * ──────────────────────────────────────────────────────────────── */

function handleInput(inputEl, subjectKey) {
    let val = parseFloat(inputEl.value);

    if (val > 100) { inputEl.value = 100; val = 100; }
    if (val < 0)   { inputEl.value = 0;   val = 0;   }

    inputEl.classList.remove('input--invalid', 'input--valid');
    if (inputEl.value !== '' && !isNaN(val)) {
        inputEl.classList.add('input--valid');
    }

    const grade      = inputEl.dataset.grade;
    const storageKey = `kd_${subjectKey}_${grade}`;
    localStorage.setItem(storageKey, inputEl.value);

    updateSubjectAvg(subjectKey);
}

/**
 * محاسبه و نمایش میانگین وزن‌دار یک درس
 * ⚡ آپدیت شده: فقط پایه‌های فعال رو در نظر می‌گیره
 */
function updateSubjectAvg(subjectKey) {
    if (!currentField) return;
    const def = MAJORS[currentField].subjects[subjectKey];
    if (!def) return;

    const avgEl = document.getElementById(`avg_${subjectKey}`);
    const barEl = document.getElementById(`progress_${subjectKey}`);

    /* اگه کل درس خاموشه */
    if (!isSubjectEnabled(subjectKey)) {
        if (avgEl) avgEl.textContent = '🔇';
        if (barEl) barEl.style.width = '0%';
        return;
    }

    const scores         = {};
    const activeGrades   = [];
    let hasAny = false;

    def.grades.forEach(grade => {
        /* فقط پایه‌های فعال */
        if (!isGradeEnabled(subjectKey, grade)) return;

        const input = document.getElementById(`input_${subjectKey}_${grade}`);
        if (input && input.value !== '') {
            scores[grade] = parseFloat(input.value);
            hasAny = true;
        }
        activeGrades.push(grade);
    });

    if (!hasAny || activeGrades.length === 0) {
        if (avgEl) avgEl.textContent = '—';
        if (barEl) barEl.style.width = '0%';
        return;
    }

    const avg = calcSubjectAverage(scores, activeGrades);
    if (avgEl) avgEl.textContent = Math.round(avg) + '٪';
    if (barEl) barEl.style.width = Math.max(0, Math.min(100, avg)) + '%';
}


/* ────────────────────────────────────────────────────────────────
 *  💾 SECTION 9: Data Persistence (ذخیره و بازیابی)
 * ──────────────────────────────────────────────────────────────── */

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
        updateSubjectAvg(key);
    }
}


/* ────────────────────────────────────────────────────────────────
 *  🧮 SECTION 10: Calculation Engine (هسته محاسباتی)
 * ──────────────────────────────────────────────────────────────── */

function getGradeWeight(grade) {
    return MODEL_CONFIG.gradeWeights[grade] || 1.0;
}

/**
 * میانگین وزن‌دار — فقط پایه‌های فعال
 */
function calcSubjectAverage(scores, activeGrades) {
    let numerator   = 0;
    let denominator = 0;

    for (const grade of activeGrades) {
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
 * نمره وزن‌دار نهایی — فقط دروس فعال
 */
function calcWeightedScore(subjectAverages, subjectDefs) {
    let numerator   = 0;
    let denominator = 0;

    for (const [key, def] of Object.entries(subjectDefs)) {
        /* ⚡ اگه درس خاموشه، ازش رد شو */
        if (!isSubjectEnabled(key)) continue;

        const w   = def.konkur_weight;
        const avg = subjectAverages[key] || 0;
        numerator   += w * avg;
        denominator += w;
    }

    return denominator === 0 ? 0 : numerator / denominator;
}

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
 * 🎯 تابع اصلی محاسبه تراز
 * ⚡ آپدیت شده: دروس/پایه‌های خاموش حذف میشن
 */
function calculateTraz(majorKey) {
    const major = MAJORS[majorKey];
    if (!major) return null;

    const subjectDefs     = major.subjects;
    const subjectAverages = {};
    const details         = {};

    let activeSubjectCount   = 0;
    let disabledSubjectNames = [];

    for (const [key, def] of Object.entries(subjectDefs)) {
        /* چک فعال بودن کل درس */
        const subjectEnabled = isSubjectEnabled(key);

        if (!subjectEnabled) {
            disabledSubjectNames.push(def.name);
            details[key] = {
                name:            def.name,
                emoji:           def.emoji,
                konkur_weight:   def.konkur_weight,
                weightedAverage: 0,
                contribution:    0,
                disabled:        true,
            };
            continue;
        }

        activeSubjectCount++;

        /* جمع‌آوری نمرات فقط پایه‌های فعال */
        const scores       = {};
        const activeGrades = [];
        let disabledGrades = [];

        def.grades.forEach(grade => {
            if (!isGradeEnabled(key, grade)) {
                disabledGrades.push(grade);
                return;
            }
            activeGrades.push(grade);
            const input = document.getElementById(`input_${key}_${grade}`);
            if (input && input.value !== '') {
                scores[grade] = parseFloat(input.value);
            }
        });

        const avg = activeGrades.length > 0
            ? calcSubjectAverage(scores, activeGrades)
            : 0;

        subjectAverages[key] = avg;

        details[key] = {
            name:              def.name,
            emoji:             def.emoji,
            konkur_weight:     def.konkur_weight,
            weightedAverage:   Math.round(avg * 100) / 100,
            contribution:      Math.round(def.konkur_weight * avg * 100) / 100,
            disabled:          false,
            disabledGrades:    disabledGrades,
            activeGradeCount:  activeGrades.length,
            totalGradeCount:   def.grades.length,
        };
    }

    const weightedScore = calcWeightedScore(subjectAverages, subjectDefs);
    const traz          = MODEL_CONFIG.beta0 + MODEL_CONFIG.k * weightedScore;
    const trazRounded   = Math.round(traz);
    const level         = getLevel(trazRounded);

    return {
        major:                major.name,
        majorEmoji:           major.emoji,
        traz:                 trazRounded,
        weightedScore:        Math.round(weightedScore * 100) / 100,
        level,
        subjectAverages,
        details,
        activeSubjectCount,
        disabledSubjectNames,
        formula: `${MODEL_CONFIG.beta0} + ${MODEL_CONFIG.k} × ${Math.round(weightedScore * 100) / 100}`,
    };
}


/* ────────────────────────────────────────────────────────────────
 *  📊 SECTION 11: Result Rendering (رندر نتایج)
 * ──────────────────────────────────────────────────────────────── */

function runCalculation() {
    if (!currentField) {
        showToast('🎓 اول رشته‌ات رو انتخاب کن!');
        return;
    }

    const result = calculateTraz(currentField);
    if (!result) return;

    renderResult(result);

    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 200);
}

function renderResult(result) {
    const bento = document.getElementById('resultBento');
    if (!bento) return;

    const level = result.level;

    /* ───── پیام هشدار دروس خاموش ───── */
    let disabledWarningHTML = '';
    if (result.disabledSubjectNames.length > 0) {
        disabledWarningHTML = `
            <div class="result-card--targets" style="border: 2px solid var(--pastel-orange);">
                <div class="targets-title">⚠️ دروس غیرفعال‌شده (از محاسبه حذف شدن)</div>
                ${result.disabledSubjectNames.map(name => `
                    <div class="target-row">
                        <span class="target-name">🔇 ${name}</span>
                        <span class="target-status target-status--far">غیرفعال</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /* ───── تارگت‌ها ───── */
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
        const isDisabled = d.disabled;

        /* نمایش تعداد پایه‌های فعال */
        let gradeInfo = '';
        if (!isDisabled && d.disabledGrades && d.disabledGrades.length > 0) {
            gradeInfo = `<small style="color:var(--pastel-orange);margin-right:4px">
                (${d.activeGradeCount}/${d.totalGradeCount} پایه فعال)
            </small>`;
        }

        return `
            <div class="detail-row" style="${isDisabled ? 'opacity:0.35;text-decoration:line-through;' : ''}">
                <span class="detail-subject">
                    ${d.emoji} ${d.name}
                    <small style="color:var(--text-muted)">(×${d.konkur_weight})</small>
                    ${isDisabled ? '<span class="disabled-badge">OFF</span>' : ''}
                    ${gradeInfo}
                </span>
                <span class="detail-avg">${isDisabled ? '🔇' : d.weightedAverage + '٪'}</span>
            </div>
        `;
    }).join('');

    /* ───── HTML نهایی ───── */
    bento.innerHTML = `
        <div class="result-card--main">
            <div class="result-label">${result.majorEmoji} تراز تخمینی رشته ${result.major}</div>
            <div class="result-traz-big">${result.traz}</div>
            <div class="result-formula">${result.formula} = ${result.traz}</div>
            <div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted)">
                ${result.activeSubjectCount} درس فعال از ${Object.keys(result.details).length}
            </div>
        </div>

        <div class="result-card--small">
            <div class="result-small-label">📏 نمره وزن‌دار</div>
            <div class="result-small-value">${result.weightedScore}</div>
            <div class="result-small-sub">از ۱۰۰</div>
        </div>

        <div class="result-card--small">
            <div class="result-small-label">🎖️ سطح</div>
            <div class="result-small-value">${level.emoji} ${level.name}</div>
            <div class="result-small-sub">${level.league}</div>
        </div>

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

        ${disabledWarningHTML}

        <div class="result-card--details">
            <div class="details-title">📋 میانگین وزن‌دار هر درس</div>
            ${detailsHTML}
        </div>

        <div class="result-card--targets">
            <div class="targets-title">🎯 فاصله تا اهداف</div>
            ${targetsHTML}
        </div>
    `;
}

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
 *  📸 SECTION 12: PNG Export (خروجی تصویری)
 * ──────────────────────────────────────────────────────────────── */

function exportPNG() {
    if (!currentField) {
        showToast('🎓 اول رشته‌ات رو انتخاب کن!');
        return;
    }

    showToast('📸 در حال گرفتن اسکرین‌شات...');

    const target = document.getElementById('appWrapper');

    html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8F6F2',
        logging: false,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
    }).then(canvas => {
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
 *  🗑️ SECTION 13: Reset (پاک‌سازی کامل)
 * ──────────────────────────────────────────────────────────────── */

function resetAll() {
    if (!confirm('🗑️ همه درصدها و تنظیمات پاک بشن؟')) return;

    for (const [majorKey, major] of Object.entries(MAJORS)) {
        for (const [subKey, def] of Object.entries(major.subjects)) {
            /* پاک‌سازی درصدها */
            def.grades.forEach(grade => {
                localStorage.removeItem(`kd_${subKey}_${grade}`);
                localStorage.removeItem(`kd_toggle_grade_${subKey}_${grade}`);
            });
            /* پاک‌سازی تاگل درس */
            localStorage.removeItem(`kd_toggle_subject_${subKey}`);
        }
    }

    /* ریست اینپوت‌ها */
    document.querySelectorAll('.percent-input').forEach(input => {
        input.value = '';
        input.classList.remove('input--valid', 'input--invalid');
    });

    /* ریست تاگل‌های درس */
    document.querySelectorAll('[id^="toggle_subject_"]').forEach(cb => {
        cb.checked = true;
    });
    document.querySelectorAll('.subject-panel').forEach(panel => {
        panel.classList.remove('panel--disabled');
    });

    /* ریست تاگل‌های پایه */
    document.querySelectorAll('[id^="toggle_grade_"]').forEach(cb => {
        cb.checked = true;
    });
    document.querySelectorAll('.grade-input-group').forEach(group => {
        group.classList.remove('grade--disabled');
    });

    /* ریست میانگین‌ها و پروگرس‌بارها */
    document.querySelectorAll('[id^="avg_"]').forEach(el => {
        el.textContent = '—';
    });
    document.querySelectorAll('[id^="progress_"]').forEach(el => {
        el.style.width = '0%';
    });

    resetResultPanel();
    showToast('🗑️ همه چیز پاک شد!');
}


/* ────────────────────────────────────────────────────────────────
 *  🍞 SECTION 14: Toast Notification
 * ──────────────────────────────────────────────────────────────── */

function showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;

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

    requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}


/* ────────────────────────────────────────────────────────────────
 *  🚀 SECTION 15: Initialization
 * ──────────────────────────────────────────────────────────────── */

(function init() {
    displayDate();

    if (currentField && MAJORS[currentField]) {
        selectField(currentField);
    }
})();
