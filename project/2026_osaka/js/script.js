let els = {};

const EXTRA_COST_POLL_INTERVAL = 15000;
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

    els.activeIndex = 0;
};

function buildStaticDayCosts() {
    return Array.prototype.map.call(els.panels, function (panel) {
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

        return day;
    });
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

    const dayIndex = els.activeIndex;

    postExtraCost({ action: 'add', day: dayIndex, desc: desc, price: price }).then(function (result) {
        applyExtraCostsUpdate(dayIndex, function (items) {
            return items.concat([{ id: result.id, key: desc, price: price }]);
        });
    });

    els.extraDesc.value = '';
    els.extraPrice.value = '';
};

function removeExtraCost(itemId) {
    const dayIndex = els.activeIndex;

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

    els.panels.forEach(function (panel, index) {
        if (index === activeIndex) {
            panel.classList.add('is-active');
        } else {
            panel.classList.remove('is-active');
        }
    });

    const day = els.dayItems[activeIndex];

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

function init() {
    setElement();
    els.staticDays = buildStaticDayCosts();
    totalAccout();

    bindExtraCostForm();
    bindCostList();
    bindTodayCostToggle();
    bindExtraCostSync();

    activeTabButton();
    activeTabPanel(0);
};

document.addEventListener('DOMContentLoaded', function () {
    (window.includesReady || Promise.resolve()).then(init);
});
