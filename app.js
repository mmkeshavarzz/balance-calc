/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  Balance-Calc — Taraz Calculator Engine v6.2             ║
 * ║  Calibrated Linear Model                                 ║
 * ║                                                           ║
 * ║  Formula: Traz = β₀ + k × S_weighted                    ║
 * ║  β₀ = 4350, k = 40.2                                    ║
 * ║  Model Error: ±19.5 (52% reduction from v5)              ║
 * ║                                                           ║
 * ║  Last Update: 1404/12/07                                 ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

(() => {
    'use strict';

    // ─────────────────────────────────────────────────
    // Section 1: Model Configuration & Constants
    // ─────────────────────────────────────────────────

    /** @type {number} مقدار پایه تراز (عرض از مبدأ) */
    const BETA_ZERO = 4350;

    /** @type {number} ضریب تبدیل نمره وزنی به تراز */
    const K_COEFFICIENT = 40.2;

    /** @type {number} خطای مدل */
    const MODEL_ERROR = 19.5;

    /** @type {number} حداکثر تراز ممکن */
    const MAX_TRAZ = 12500;

    /** @type {string} کلید localStorage */
    const STORAGE_KEY = 'taraz_calc_v6_data';


    // ─────────────────────────────────────────────────
    // Section 2: Fields & Subjects Configuration
    // ─────────────────────────────────────────────────

    /**
     * تعریف رشته‌ها و دروس
     *
     * وزن‌ها (رشته تجربی — مدل v6.2 کالیبره):
     *   زیست:  12/34 ≈ 35.3%
     *   شیمی:   9/34 ≈ 26.5%
     *   فیزیک:  6/34 ≈ 17.6%
     *   ریاضی:  6/34 ≈ 17.6%
     *   زمین:   1/34 ≈  2.9%
     */
    const FIELDS_CONFIG = {
        tajrobi: {
            label: 'تجربی',
            totalWeight: 34,
            subjects: [
                { id: 'zist',  name: 'زیست‌شناسی', icon: '🧬', weight: 12, wide: true  },
                { id: 'shimi', name: 'شیمی',       icon: '⚗️', weight: 9,  wide: false },
                { id: 'fizik', name: 'فیزیک',      icon: '⚡', weight: 6,  wide: false },
                { id: 'riazi', name: 'ریاضی',      icon: '📐', weight: 6,  wide: false },
                { id: 'zamin', name: 'زمین‌شناسی',  icon: '🌍', weight: 1,  wide: false },
            ]
        },
        riazi: {
            label: 'ریاضی',
            totalWeight: 34,
            subjects: [
                { id: 'riazi_r', name: 'ریاضیات',  icon: '📐', weight: 12, wide: true  },
                { id: 'fizik_r', name: 'فیزیک',    icon: '⚡', weight: 11, wide: false },
                { id: 'shimi_r', name: 'شیمی',     icon: '⚗️', weight: 9,  wide: false },
                { id: 'hndse',   name: 'هندسه',    icon: '📏', weight: 2,  wide: false },
            ]
        },
        ensani: {
            label: 'انسانی',
            totalWeight: 34,
            subjects: [
                { id: 'adabiat',     name: 'ادبیات',          icon: '📖', weight: 8, wide: true  },
                { id: 'arabi',       name: 'عربی',            icon: '🕌', weight: 7, wide: false },
                { id: 'tarikh',      name: 'تاریخ و جغرافیا', icon: '🗺️', weight: 7, wide: false },
                { id: 'falsafe',     name: 'فلسفه و منطق',    icon: '🧠', weight: 6, wide: false },
                { id: 'ravanshenasi', name: 'روان‌شناسی',      icon: '💡', weight: 4, wide: false },
                { id: 'eqtesad',     name: 'اقتصاد',          icon: '💰', weight: 2, wide: false },
            ]
        },
        honar: {
            label: 'هنر',
            totalWeight: 28,
            subjects: [
                { id: 'darsname',     name: 'درسنامه هنر',     icon: '🎭', weight: 10, wide: true  },
                { id: 'khalaghiat',   name: 'خلاقیت تصویری',   icon: '🖌️', weight: 8,  wide: false },
                { id: 'savad_basari', name: 'سواد بصری',       icon: '👁️', weight: 6,  wide: false },
                { id: 'tarhsazi',     name: 'طراحی',           icon: '✏️', weight: 4,  wide: false },
            ]
        }
    };


    // ─────────────────────────────────────────────────
    // Section 3: Application State
    // ─────────────────────────────────────────────────

    /** @type {string|null} رشته فعلی */
    let currentField = null;

    /**
     * وضعیت هر درس
     * @type {Object.<string, {percent: number, enabled: boolean}>}
     */
    let subjectsState = {};

    /** @type {ReturnType<typeof setTimeout>|null} */
    let calcDebounce = null;


    // ─────────────────────────────────────────────────
    // Section 4: DOM References
    // ─────────────────────────────────────────────────

    const subjectsGridEl = document.getElementById('subjectsGrid');
    const resultsCardEl  = document.getElementById('resultsCard');
    const actionsEl      = document.getElementById('actionsSection');
    const trazValueEl    = document.getElementById('trazValue');
    const errorMarginEl  = document.getElementById('errorMargin');
    const scoreFillEl    = document.getElementById('scoreFill');
    const breakdownEl    = document.getElementById('breakdownGrid');
    const toastEl        = document.getElementById('toast');


    // ─────────────────────────────────────────────────
    // Section 5: Field Selection
    // ─────────────────────────────────────────────────

    /**
     * انتخاب رشته و رندر فرم دروس
     * @param {string} fieldKey — کلید رشته
     */
    window.selectField = function(fieldKey) {
        if (!FIELDS_CONFIG[fieldKey]) return;

        currentField = fieldKey;
        const config = FIELDS_CONFIG[fieldKey];

        // آپدیت دکمه‌های رشته
        document.querySelectorAll('.field-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.field === fieldKey);
        });

        // ساخت state اولیه
        subjectsState = {};
        config.subjects.forEach(sub => {
            subjectsState[sub.id] = { percent: 0, enabled: true };
        });

        // بارگذاری داده‌های ذخیره‌شده
        _loadFromLocal();

        // رندر کارت‌ها
        _renderSubjectCards(config);

        // نمایش بخش‌ها
        subjectsGridEl.style.display = 'grid';
        resultsCardEl.style.display  = 'block';

        /*
         * فیکس v1.2.3 — حل مشکل نمایش دکمه‌ها در دسکتاپ
         * قبلاً: actionsEl.style.opacity = '1'; (inline → تداخل)
         * حالا: حذف کلاس مخفی‌کننده (CSS class based)
         */
        actionsEl.classList.remove('actions-row--hidden');

        // انیمیشن ورود
        subjectsGridEl.classList.add('animate-in');
        resultsCardEl.classList.add('animate-in');

        // محاسبه اولیه
        _recalculate();
    };


    // ─────────────────────────────────────────────────
    // Section 6: Render Subject Cards
    // ─────────────────────────────────────────────────

    /**
     * ساخت کارت‌های ورودی دروس
     * @param {Object} config
     */
    function _renderSubjectCards(config) {
        subjectsGridEl.innerHTML = '';

        config.subjects.forEach((sub, idx) => {
            const state = subjectsState[sub.id];
            const weightPct = ((sub.weight / config.totalWeight) * 100).toFixed(1);

            const card = document.createElement('div');
            card.className = [
                'subject-card',
                sub.wide ? 'subject-card--wide' : '',
                !state.enabled ? 'subject-card--disabled' : '',
                'animate-in'
            ].filter(Boolean).join(' ');

            card.dataset.subject = sub.id;
            card.style.animationDelay = `${0.05 * (idx + 1)}s`;

            card.innerHTML = `
                <div class="subject-card__header">
                    <div class="subject-card__title">
                        <span class="subject-card__title-icon">${sub.icon}</span>
                        ${sub.name}
                        <span class="subject-card__weight">${weightPct}%</span>
                    </div>
                    <label class="toggle-switch" title="فعال/غیرفعال">
                        <input type="checkbox"
                               ${state.enabled ? 'checked' : ''}
                               onchange="toggleSubject('${sub.id}', this.checked)">
                        <span class="toggle-switch__slider"></span>
                    </label>
                </div>
                <div class="subject-card__input-group">
                    <input type="number"
                           class="subject-card__input"
                           id="input_${sub.id}"
                           min="-33" max="100" step="1"
                           value="${state.percent}"
                           ${!state.enabled ? 'disabled' : ''}
                           oninput="updatePercent('${sub.id}', this.value, 'input')"
                           placeholder="درصد">
                    <span class="subject-card__input-suffix">%</span>
                </div>
                <input type="range"
                       class="subject-card__slider"
                       id="slider_${sub.id}"
                       min="-33" max="100" step="1"
                       value="${state.percent}"
                       ${!state.enabled ? 'disabled' : ''}
                       oninput="updatePercent('${sub.id}', this.value, 'slider')">
            `;

            subjectsGridEl.appendChild(card);
        });
    }


    // ─────────────────────────────────────────────────
    // Section 7: User Interaction Handlers
    // ─────────────────────────────────────────────────

    /**
     * آپدیت درصد یک درس
     * @param {string} subjectId
     * @param {string|number} value
     * @param {string} source — 'input' | 'slider'
     */
    window.updatePercent = function(subjectId, value, source) {
        let num = parseFloat(value);
        if (isNaN(num)) num = 0;

        // بازه مجاز: -33 تا 100
        num = Math.max(-33, Math.min(100, num));
        subjectsState[subjectId].percent = num;

        // همگام‌سازی input ↔ slider
        const inputEl  = document.getElementById(`input_${subjectId}`);
        const sliderEl = document.getElementById(`slider_${subjectId}`);

        if (source === 'slider' && inputEl)  inputEl.value  = num;
        if (source === 'input'  && sliderEl) sliderEl.value = num;

        // محاسبه مجدد با debounce
        if (calcDebounce) clearTimeout(calcDebounce);
        calcDebounce = setTimeout(_recalculate, 50);
    };

    /**
     * فعال/غیرفعال کردن یک درس
     * @param {string} subjectId
     * @param {boolean} enabled
     */
    window.toggleSubject = function(subjectId, enabled) {
        subjectsState[subjectId].enabled = enabled;

        const card     = document.querySelector(`.subject-card[data-subject="${subjectId}"]`);
        const inputEl  = document.getElementById(`input_${subjectId}`);
        const sliderEl = document.getElementById(`slider_${subjectId}`);

        if (card)     card.classList.toggle('subject-card--disabled', !enabled);
        if (inputEl)  inputEl.disabled  = !enabled;
        if (sliderEl) sliderEl.disabled = !enabled;

        _recalculate();
    };


    // ─────────────────────────────────────────────────
    // Section 8: Core Calculation Engine (v6.2)
    // ─────────────────────────────────────────────────

    /**
     * محاسبه تراز — مدل خطی کالیبره‌شده
     *
     * Traz = β₀ + k × S_weighted
     * S_weighted = Σ(wᵢ × pᵢ) / Σ(wᵢ)  ×  totalWeight
     *
     * وقتی بعضی دروس خاموشن، وزن‌ها مجدداً نرمالایز میشن
     */
    function _recalculate() {
        if (!currentField) return;

        const config = FIELDS_CONFIG[currentField];
        let sumWeightedPercent = 0;
        let sumActiveWeights   = 0;
        const breakdownItems   = [];

        config.subjects.forEach(sub => {
            const state = subjectsState[sub.id];
            if (!state || !state.enabled) return;

            const wFrac      = sub.weight / config.totalWeight;
            const contribution = wFrac * state.percent;

            sumWeightedPercent += contribution;
            sumActiveWeights   += sub.weight;

            breakdownItems.push({
                name:    sub.name,
                icon:    sub.icon,
                percent: state.percent,
                weight:  (wFrac * 100).toFixed(1),
                contribution: contribution.toFixed(2)
            });
        });

        // نرمال‌سازی وزنی برای دروس خاموش
        let sWeighted = 0;
        if (sumActiveWeights > 0) {
            const normFactor = config.totalWeight / sumActiveWeights;
            sWeighted = sumWeightedPercent * normFactor;
        }

        // فرمول نهایی
        let traz = BETA_ZERO + K_COEFFICIENT * sWeighted;
        traz = Math.max(0, Math.min(MAX_TRAZ, Math.round(traz)));

        _updateResultsUI(traz, sWeighted, breakdownItems);
    }


    // ─────────────────────────────────────────────────
    // Section 9: Results UI Update
    // ─────────────────────────────────────────────────

    /**
     * آپدیت بخش نتایج
     * @param {number} traz
     * @param {number} sWeighted
     * @param {Array} breakdown
     */
    function _updateResultsUI(traz, sWeighted, breakdown) {
        // عدد تراز (فارسی)
        trazValueEl.textContent = _toPersianDigits(traz.toLocaleString('en-US'));

        // بازه اطمینان
        const trazMin = Math.max(0, traz - MODEL_ERROR);
        const trazMax = Math.min(MAX_TRAZ, traz + MODEL_ERROR);
        errorMarginEl.textContent =
            `بازه اطمینان: ${_toPersianDigits(Math.round(trazMin).toLocaleString())} تا ${_toPersianDigits(Math.round(trazMax).toLocaleString())} (±${_toPersianDigits(MODEL_ERROR.toString())})`;

        // Progress Bar
        const fillPct = Math.max(0, Math.min(100, (sWeighted / 100) * 100));
        scoreFillEl.style.width = `${fillPct}%`;

        // تفکیک دروس
        breakdownEl.innerHTML = '';

        // نمره وزنی کل
        const swEl = document.createElement('div');
        swEl.className = 'breakdown-item';
        swEl.innerHTML = `
            <div class="breakdown-item__label">نمره وزنی</div>
            <div class="breakdown-item__value">${_toPersianDigits(sWeighted.toFixed(1))}</div>
        `;
        breakdownEl.appendChild(swEl);

        // هر درس
        breakdown.forEach(item => {
            const el = document.createElement('div');
            el.className = 'breakdown-item';
            el.innerHTML = `
                <div class="breakdown-item__label">${item.icon} ${item.name}</div>
                <div class="breakdown-item__value">${_toPersianDigits(item.percent.toString())}%</div>
            `;
            breakdownEl.appendChild(el);
        });

        // پالس انیمیشن
        trazValueEl.classList.remove('pulse-once');
        void trazValueEl.offsetWidth; // force reflow
        trazValueEl.classList.add('pulse-once');
    }


    // ─────────────────────────────────────────────────
    // Section 10: Local Storage
    // ─────────────────────────────────────────────────

    /**
     * ذخیره در localStorage
     */
    window.saveToLocal = function() {
        try {
            const data = {
                version:   '6.2',
                field:     currentField,
                subjects:  subjectsState,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            _showToast('✅ داده‌ها با موفقیت ذخیره شد!');
        } catch (err) {
            console.warn('[Storage] Save failed:', err);
            _showToast('❌ خطا در ذخیره‌سازی!');
        }
    };

    /**
     * بارگذاری از localStorage
     * @private
     */
    function _loadFromLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const data = JSON.parse(raw);
            if (data.field !== currentField) return;

            Object.keys(data.subjects || {}).forEach(key => {
                if (subjectsState[key]) {
                    subjectsState[key].percent = data.subjects[key].percent ?? 0;
                    subjectsState[key].enabled = data.subjects[key].enabled ?? true;
                }
            });
        } catch (err) {
            console.warn('[Storage] Load failed:', err);
        }
    }

    /**
     * بارگذاری خودکار آخرین session
     * @private
     */
    function _autoLoadLastSession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.field && FIELDS_CONFIG[data.field]) {
                selectField(data.field);
            }
        } catch (err) {
            console.warn('[Storage] Auto-load failed:', err);
        }
    }


    // ─────────────────────────────────────────────────
    // Section 11: Reset
    // ─────────────────────────────────────────────────

    /**
     * پاک کردن همه داده‌ها
     */
    window.resetAll = function() {
        if (!confirm('همه داده‌ها پاک بشه؟ 🗑️')) return;

        localStorage.removeItem(STORAGE_KEY);
        currentField  = null;
        subjectsState = {};

        // مخفی کردن بخش‌ها
        subjectsGridEl.style.display = 'none';
        resultsCardEl.style.display  = 'none';
        actionsEl.classList.add('actions-row--hidden');

        // ریست دکمه‌های رشته
        document.querySelectorAll('.field-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        trazValueEl.textContent  = '—';
        scoreFillEl.style.width  = '0%';
        breakdownEl.innerHTML    = '';

        _showToast('🗑️ همه چیز پاک شد!');
    };


    // ─────────────────────────────────────────────────
    // Section 12: PNG Export (html2canvas)
    // ─────────────────────────────────────────────────

    /**
     * خروجی PNG از اپلیکیشن
     * از html2canvas با کیفیت رتینا (scale: 2) استفاده می‌کنه
     */
    window.exportPNG = function() {
        const container = document.getElementById('appContainer');

        if (!container || typeof html2canvas === 'undefined') {
            _showToast('❌ کتابخانه html2canvas بارگذاری نشده!');
            return;
        }

        _showToast('📸 در حال آماده‌سازی تصویر...');

        // اضافه کردن کلاس مخصوص اکسپورت
        container.classList.add('exporting');

        html2canvas(container, {
            backgroundColor: '#F8F6F2',
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            ignoreElements: (el) => {
                return el.classList && el.classList.contains('actions-row');
            }
        }).then(canvas => {
            container.classList.remove('exporting');

            // دانلود فایل
            const link      = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);

            link.download = `taraz-result-${timestamp}.png`;
            link.href     = canvas.toDataURL('image/png', 1.0);
            link.click();

            _showToast('✅ تصویر با موفقیت ذخیره شد!');
        }).catch(err => {
            container.classList.remove('exporting');
            console.error('[Export] PNG generation failed:', err);
            _showToast('❌ خطا در ساخت تصویر!');
        });
    };


    // ─────────────────────────────────────────────────
    // Section 13: Utility Functions
    // ─────────────────────────────────────────────────

    /**
     * تبدیل اعداد انگلیسی به فارسی
     * @param {string} str
     * @returns {string}
     */
    function _toPersianDigits(str) {
        const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
        return String(str).replace(/[0-9]/g, d => fa[parseInt(d)]);
    }

    /**
     * نمایش Toast / Snackbar
     * @param {string} message
     * @param {number} [duration=2500]
     */
    function _showToast(message, duration) {
        duration = duration || 2500;
        toastEl.textContent = message;
        toastEl.classList.add('toast--visible');

        setTimeout(() => {
            toastEl.classList.remove('toast--visible');
        }, duration);
    }


    // ─────────────────────────────────────────────────
    // Section 14: Keyboard Shortcuts
    // ─────────────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
        // Ctrl+S → ذخیره
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (currentField) saveToLocal();
        }

        // Ctrl+E → خروجی PNG
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (currentField) exportPNG();
        }

        // Escape → ریست
        if (e.key === 'Escape' && currentField) {
            resetAll();
        }
    });


    // ─────────────────────────────────────────────────
    // Section 15: Initialization
    // ─────────────────────────────────────────────────

    /**
     * بوت‌استرپ اپلیکیشن
     */
    function _init() {
        _autoLoadLastSession();

        // پیام خوش‌آمدگویی
        if (!currentField) {
            setTimeout(() => {
                _showToast('👋 سلام! اول رشته‌ت رو انتخاب کن', 3000);
            }, 800);
        }
    }

    // اجرا
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

})();
