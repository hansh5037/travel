let els = {};

function setElement() {
    els.buttons = document.querySelectorAll('.tab-list');
    els.panels = document.querySelectorAll('.tabpanel');

    els.cost = document.querySelectorAll('.cost');
    els.costTwo = document.querySelectorAll('.cost-two');
    els.total = document.querySelector('.total');
    els.todayTotal = document.querySelector('.today-total-cost');
    els.todayTotalist = document.querySelector('.today-cost-list');
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

    els.panels.forEach(function (panel) {
        const day = {
            cost: [],
            costTwo: [],
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
};

function init() {
    setElement();
    totalAccout();
    setCostNumber();

    activeTabButton();
    activeTabPanel(0);
};

document.addEventListener('DOMContentLoaded', init);