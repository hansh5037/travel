let els = {};

const EXTRA_COST_POLL_INTERVAL = 15000;
const PACKING_STORAGE_KEY = 'osaka2026-packing-checklist';
let extraCostsCache = {};

function setElement() {
    els.buttons = document.querySelectorAll('.tab-list');
    els.panels = document.querySelectorAll('.tabpanel');

    els.total = document.querySelector('.total');
    els.todayTotal = document.querySelector('.today-total-cost');
    els.todayCostList = document.querySelector('.today-cost-list');
    els.todayCost = document.querySelector('.today-cost');
    els.todayCostButton = document.querySelector('.today-cost-button');

    els.extraDesc = document.querySelector('.today-cost-form__desc');
    els.extraPrice = document.querySelector('.today-cost-form__price');
    els.extraAdd = document.querySelector('.today-cost-form__add');

    els.packingProgress = document.querySelector('.packing-progress');
    els.packingCheckboxes = document.querySelectorAll('.packing-checkbox');

    els.activeIndex = 0;
};

function buildStaticDayCosts() {
    const costPanels = Array.prototype.filter.call(els.panels, function (panel) {
        return panel.dataset.day !== undefined;
    });

    const days = [];

    costPanels.forEach(function (panel) {
        const dayIndex = Number(panel.dataset.day);
        const day = { cost: [], costTwo: [], staticTotal: 0 };

        panel.querySelectorAll('.cost').forEach(function (element) {
            const price = Number(element.textContent);
            element.textContent = price.toLocaleString();
            day.cost.push({ key: element.dataset.key || '', price: price });
            day.staticTotal += price;
        });

        panel.querySelectorAll('.cost-two').forEach(function (element) {
            const price = Number(element.textContent) / 2;
            day.costTwo.push({ key: element.dataset.key || '', price: price });
            day.staticTotal += price;
        });

        days[dayIndex] = day;
    });

    return days;
};

function postExtraCost(params) {
    return fetch(SHEETS_WEB_APP_URL, {
        method: 'POST',
        body: new URLSearchParams(params)
    }).then(function (response) { return response.json(); });
};

function applyExtraCostsUpdate(dayIndex, updateFn) {
    extraCostsCache[dayIndex] = updateFn(extraCostsCache[dayIndex] || []);

    totalAccout();
    activeTabPanel(els.activeIndex);
};

function fetchExtraCosts() {
    if (document.hidden) {
        return Promise.resolve();
    }

    return fetch(SHEETS_WEB_APP_URL)
        .then(function (response) { return response.json(); })
        .then(function (rows) {
            const nextCache = {};

            rows.forEach(function (row) {
                if (!nextCache[row.day]) {
                    nextCache[row.day] = [];
                }
                nextCache[row.day].push({ id: row.id, key: row.key, price: row.price });
            });

            if (JSON.stringify(nextCache) === JSON.stringify(extraCostsCache)) {
                return;
            }

            extraCostsCache = nextCache;
            totalAccout();
            activeTabPanel(els.activeIndex);
        });
};

function bindExtraCostSync() {
    fetchExtraCosts();
    setInterval(fetchExtraCosts, EXTRA_COST_POLL_INTERVAL);
};

function addExtraCost() {
    const desc = els.extraDesc.value.trim();
    const price = Number(els.extraPrice.value);

    if (!price || price <= 0) {
        return;
    }

    const dayIndex = els.activeDay;

    if (dayIndex === null) {
        return;
    }

    postExtraCost({ action: 'add', day: dayIndex, desc: desc, price: price }).then(function (result) {
        applyExtraCostsUpdate(dayIndex, function (items) {
            return items.concat([{ id: result.id, key: desc, price: price }]);
        });
    });

    els.extraDesc.value = '';
    els.extraPrice.value = '';
};

function removeExtraCost(itemId) {
    const dayIndex = els.activeDay;

    postExtraCost({ action: 'delete', id: itemId }).then(function () {
        applyExtraCostsUpdate(dayIndex, function (items) {
            return items.filter(function (item) { return item.id !== itemId; });
        });
    });
};

function bindExtraCostForm() {
    els.extraAdd.addEventListener('click', addExtraCost);

    els.extraPrice.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            addExtraCost();
        }
    });
};

function bindTodayCostToggle() {
    els.todayCostButton.addEventListener('click', function () {
        const isActive = els.todayCost.classList.toggle('is-active');
        els.todayCostButton.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
};

function loadPackingState() {
    try {
        return JSON.parse(localStorage.getItem(PACKING_STORAGE_KEY)) || {};
    } catch (error) {
        return {};
    }
};

function updatePackingProgress() {
    const total = els.packingCheckboxes.length;
    const checked = Array.prototype.filter.call(els.packingCheckboxes, function (checkbox) {
        return checkbox.checked;
    }).length;

    els.packingProgress.innerText = checked + ' / ' + total;
};

function bindPackingChecklist() {
    const state = loadPackingState();

    els.packingCheckboxes.forEach(function (checkbox) {
        checkbox.checked = !!state[checkbox.dataset.packingId];

        checkbox.addEventListener('change', function () {
            state[checkbox.dataset.packingId] = checkbox.checked;
            localStorage.setItem(PACKING_STORAGE_KEY, JSON.stringify(state));
            updatePackingProgress();
        });
    });

    updatePackingProgress();
};

function selectTab(index) {
    els.buttons.forEach(function (btn, btnIndex) {
        const tabButton = btn.querySelector('.tab-button');
        const isSelected = btnIndex === index;

        btn.classList.toggle('is-active', isSelected);
        tabButton.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        tabButton.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    activeTabPanel(index);
};

function activeTabButton() {
    els.buttons.forEach(function (button, index) {
        const tabButton = button.querySelector('.tab-button');

        tabButton.addEventListener('click', function () {
            selectTab(index);
        });

        tabButton.addEventListener('keydown', function (event) {
            const lastIndex = els.buttons.length - 1;
            let nextIndex = null;

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                nextIndex = index === lastIndex ? 0 : index + 1;
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                nextIndex = index === 0 ? lastIndex : index - 1;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = lastIndex;
            } else {
                return;
            }

            event.preventDefault();
            selectTab(nextIndex);
            els.buttons[nextIndex].querySelector('.tab-button').focus();
        });
    });
};

function activeTabPanel(activeIndex) {
    els.activeIndex = activeIndex;

    let activePanel = null;

    els.panels.forEach(function (panel, index) {
        if (index === activeIndex) {
            panel.classList.add('is-active');
            activePanel = panel;
        } else {
            panel.classList.remove('is-active');
        }
    });

    els.activeDay = activePanel && activePanel.dataset.day !== undefined
        ? Number(activePanel.dataset.day)
        : null;

    els.todayCost.classList.toggle('is-hidden', els.activeDay === null);

    if (els.activeDay === null) {
        return;
    }

    const day = els.dayItems[els.activeDay];

    els.todayTotal.innerText = day.todayTotal.toLocaleString();
    setCostList(day);
};

function totalAccout() {
    let total = 0;

    const accout = els.staticDays.map(function (staticDay, index) {
        const extra = extraCostsCache[index] || [];
        const extraTotal = extra.reduce(function (sum, item) { return sum + item.price; }, 0);
        const todayTotal = staticDay.staticTotal + extraTotal;

        total += todayTotal;

        return { cost: staticDay.cost, costTwo: staticDay.costTwo, extra: extra, todayTotal: todayTotal };
    });

    els.dayItems = accout;
    els.total.innerText = total.toLocaleString();

    return total;
};

function formatCostLabel(item) {
    return (item.key ? item.key + ' : ' : '') + item.price.toLocaleString() + '원';
};

function createCostListItem(item, removable) {
    const li = document.createElement('li');
    li.classList.add('today-cost-list-item');

    if (!removable) {
        li.textContent = formatCostLabel(item);
        return li;
    }

    const label = document.createElement('span');
    label.textContent = formatCostLabel(item);
    li.appendChild(label);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.classList.add('today-cost-list-item__remove');
    removeBtn.textContent = '삭제';
    removeBtn.setAttribute('aria-label', formatCostLabel(item) + ' 삭제');
    removeBtn.dataset.extraId = item.id;
    li.appendChild(removeBtn);

    return li;
};

function setCostList(day) {
    els.todayCostList.innerHTML = '';

    day.cost.concat(day.costTwo).forEach(function (item) {
        els.todayCostList.appendChild(createCostListItem(item, false));
    });

    (day.extra || []).forEach(function (item) {
        els.todayCostList.appendChild(createCostListItem(item, true));
    });
};

function bindCostList() {
    els.todayCostList.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('.today-cost-list-item__remove');

        if (!removeBtn) {
            return;
        }
        removeExtraCost(removeBtn.dataset.extraId);
    });
};

function enhanceNewWindowLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
        if (!link.hasAttribute('rel')) {
            link.setAttribute('rel', 'noopener noreferrer');
        }
        if (!link.querySelector('.new-window-note')) {
            const note = document.createElement('span');
            note.className = 'sr-only new-window-note';
            note.textContent = ' (새 창에서 열림)';
            link.appendChild(note);
        }
    });
};

function init() {
    setElement();
    els.staticDays = buildStaticDayCosts();
    totalAccout();

    bindExtraCostForm();
    bindCostList();
    bindTodayCostToggle();
    bindExtraCostSync();

    bindPackingChecklist();

    activeTabButton();
    activeTabPanel(0);
    enhanceNewWindowLinks();
};

function refreshScrollBounds() {
    document.body.style.overflow = 'hidden';
    document.body.offsetHeight;
    document.body.style.overflow = '';
};

document.addEventListener('DOMContentLoaded', function () {
    const contentReady = window.includesReady || Promise.resolve();
    const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();

    contentReady.then(init);
    Promise.all([contentReady, fontsReady]).then(refreshScrollBounds);
});
