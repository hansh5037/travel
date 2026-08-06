let els = {};

const EXTRA_COST_STORAGE_KEY = 'osaka2026-extra-costs';

function setElement() {
    els.buttons = document.querySelectorAll('.tab-list');
    els.panels = document.querySelectorAll('.tabpanel');

    els.cost = document.querySelectorAll('.cost');
    els.costTwo = document.querySelectorAll('.cost-two');
    els.total = document.querySelector('.total');
    els.todayTotal = document.querySelector('.today-total-cost');
    els.todayTotalist = document.querySelector('.today-cost-list');

    els.extraDesc = document.querySelector('.today-cost-form__desc');
    els.extraPrice = document.querySelector('.today-cost-form__price');
    els.extraAdd = document.querySelector('.today-cost-form__add');

    els.activeIndex = 0;
};

function loadExtraCosts() {
    try {
        return JSON.parse(localStorage.getItem(EXTRA_COST_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
};

function saveExtraCosts(extraData) {
    localStorage.setItem(EXTRA_COST_STORAGE_KEY, JSON.stringify(extraData));
};

function addExtraCost() {
    const desc = els.extraDesc.value.trim();
    const price = Number(els.extraPrice.value);

    if (!price || price <= 0) {
        return;
    }

    const index = els.activeIndex;
    const extraData = loadExtraCosts();

    if (!extraData[index]) {
        extraData[index] = [];
    }
    extraData[index].push({ key: desc, price: price });
    saveExtraCosts(extraData);

    els.extraDesc.value = '';
    els.extraPrice.value = '';

    totalAccout();
    activeTabPanel(index);
};

function bindExtraCostForm() {
    els.extraAdd.addEventListener('click', addExtraCost);

    els.extraPrice.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            addExtraCost();
        }
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

function totalAccout() {
    let total = 0;
    const accout = [];
    const extraData = loadExtraCosts();

    els.panels.forEach(function (panel, index) {
        const day = {
            cost: [],
            costTwo: [],
            extra: extraData[index] || [],
            todayTotal: 0
        };

        panel.querySelectorAll('.cost').forEach(function (element) {
            const price = Number(element.textContent);
            day.cost.push({ key: element.dataset.key || '', price: price });
            day.todayTotal += price;
        });

        panel.querySelectorAll('.cost-two').forEach(function (element) {
            const price = Number(element.textContent) / 2;
            day.costTwo.push({ key: element.dataset.key || '', price: price });
            day.todayTotal += price;
        });

        day.extra.forEach(function (item) {
            day.todayTotal += item.price;
        });

        accout.push(day);
        total += day.todayTotal;
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

	(day.extra || []).forEach(function (item, extraIndex) {
		const li = document.createElement('li');
		li.classList.add('today-cost-listitem');

		const label = document.createElement('span');
		label.textContent = (item.key ? item.key + ' : ' : '') + item.price.toLocaleString() + '원';
		li.appendChild(label);

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.classList.add('today-cost-listitem__remove');
		removeBtn.textContent = '삭제';
		removeBtn.dataset.extraIndex = extraIndex;
		li.appendChild(removeBtn);

		els.todayTotalist.appendChild(li);
	});
};

function removeExtraCost(extraIndex) {
    const index = els.activeIndex;
    const extraData = loadExtraCosts();

    if (!extraData[index]) {
        return;
    }
    extraData[index].splice(extraIndex, 1);
    saveExtraCosts(extraData);

    totalAccout();
    activeTabPanel(index);
};

function bindCostList() {
    els.todayTotalist.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('.today-cost-listitem__remove');

        if (!removeBtn) {
            return;
        }
        removeExtraCost(Number(removeBtn.dataset.extraIndex));
    });
};

function init() {
    setElement();
    totalAccout();
    setCostNumber();

    bindExtraCostForm();
    bindCostList();

    activeTabButton();
    activeTabPanel(0);
};

document.addEventListener('DOMContentLoaded', init);