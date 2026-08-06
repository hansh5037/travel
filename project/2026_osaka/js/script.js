let els = {};

const EXTRA_COST_POLL_INTERVAL = 15000;
let extraCostsCache = {};

function setElement() {
    els.buttons = document.querySelectorAll('.tab-list');
    els.panels = document.querySelectorAll('.tabpanel');

    els.cost = document.querySelectorAll('.cost');
    els.costTwo = document.querySelectorAll('.cost-two');
    els.total = document.querySelector('.total');
    els.todayTotal = document.querySelector('.today-total-cost');
    els.todayTotalist = document.querySelector('.today-cost-list');
    els.todayCostButton = document.querySelector('.today-cost-button');

    els.extraDesc = document.querySelector('.today-cost-form__desc');
    els.extraPrice = document.querySelector('.today-cost-form__price');
    els.extraAdd = document.querySelector('.today-cost-form__add');

    els.activeIndex = 0;
};

function fetchExtraCosts() {
    return fetch(SHEETS_WEB_APP_URL)
        .then(function (response) { return response.json(); })
        .then(function (rows) {
            extraCostsCache = {};

            rows.forEach(function (row) {
                if (!extraCostsCache[row.day]) {
                    extraCostsCache[row.day] = [];
                }
                extraCostsCache[row.day].push({ id: row.id, key: row.key, price: row.price });
            });

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

    fetch(SHEETS_WEB_APP_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'add', day: els.activeIndex, desc: desc, price: price })
    }).then(fetchExtraCosts);

    els.extraDesc.value = '';
    els.extraPrice.value = '';
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
        els.todayCostButton.classList.toggle('is-active');
    });
};

function activeTabButton() {
    els.buttons.forEach(function (button, index) {
        button.addEventListener('click', function () {

            els.buttons.forEach(function (btn) {
                btn.classList.remove('is-active');
                btn.querySelector('.tab-button').setAttribute('aria-selected', 'false');
            });

            button.classList.add('is-active');
            button.querySelector('.tab-button').setAttribute('aria-selected', 'true');

            activeTabPanel(index);
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

    els.todayTotal.innerText = els.dayTotals[activeIndex].toLocaleString();
    setCostList(els.dayItems[activeIndex]);
};

function setCostNumber() {
    els.cost.forEach(function (element) {
        const price = Number(element.innerText);

        element.innerText = price.toLocaleString();
    });
}

function buildStaticDayCosts() {
    return Array.prototype.map.call(els.panels, function (panel) {
        const day = { cost: [], costTwo: [], staticTotal: 0 };

        panel.querySelectorAll('.cost').forEach(function (element) {
            const price = Number(element.textContent);
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

function totalAccout() {
    let total = 0;

    const accout = els.staticDays.map(function (staticDay, index) {
        const extra = extraCostsCache[index] || [];
        const extraTotal = extra.reduce(function (sum, item) { return sum + item.price; }, 0);
        const todayTotal = staticDay.staticTotal + extraTotal;

        total += todayTotal;

        return { cost: staticDay.cost, costTwo: staticDay.costTwo, extra: extra, todayTotal: todayTotal };
    });

    els.dayTotals = accout.map(function (day) {
        return day.todayTotal;
    });
    els.dayItems = accout;

    els.total.innerText = total.toLocaleString();
    return total;
};

function setCostList(day) {
	els.todayTotalist.innerHTML = '';

	day.cost.concat(day.costTwo).forEach(function (item) {
		const li = document.createElement('li');
		li.classList.add('today-cost-listitem');
		li.textContent = (item.key ? item.key + ' : ' : '') + item.price.toLocaleString() + '원';
		els.todayTotalist.appendChild(li);
	});

	(day.extra || []).forEach(function (item) {
		const li = document.createElement('li');
		li.classList.add('today-cost-listitem');

		const label = document.createElement('span');
		label.textContent = (item.key ? item.key + ' : ' : '') + item.price.toLocaleString() + '원';
		li.appendChild(label);

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.classList.add('today-cost-listitem__remove');
		removeBtn.textContent = '삭제';
		removeBtn.dataset.extraId = item.id;
		li.appendChild(removeBtn);

		els.todayTotalist.appendChild(li);
	});
};

function removeExtraCost(itemId) {
    fetch(SHEETS_WEB_APP_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'delete', id: itemId })
    }).then(fetchExtraCosts);
};

function bindCostList() {
    els.todayTotalist.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('.today-cost-listitem__remove');

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
    setCostNumber();

    bindExtraCostForm();
    bindCostList();
    bindTodayCostToggle();
    bindExtraCostSync();

    activeTabButton();
    activeTabPanel(0);
};

document.addEventListener('DOMContentLoaded', init);