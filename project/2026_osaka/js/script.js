let els = {};

function setElement () {
	els.buttons = document.querySelectorAll('.tab-list');
	els.panels = document.querySelectorAll('.tabpanel');

	els.cost = document.querySelectorAll('.cost');
	els.costTwo = document.querySelectorAll('.cost-two');
	els.total = document.querySelector('.total');
	els.todayTotal = document.querySelector('.today-total-cost');
};

function activeTabButton () {
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

function activeTabPanel (activeIndex) {
	els.panels.forEach(function (panel, index) {
		if (index === activeIndex) {
			panel.classList.add('is-active');
		} else {
			panel.classList.remove('is-active');
		}
	});

	els.todayTotal.innerText = els.dayTotals[activeIndex].toLocaleString();
};

function setCostNumber () {
	els.cost.forEach (function (element) {
		const price = Number(element.innerText); 
	
		element.innerText = price.toLocaleString();
	});
}

function totalAccout () {
	let total = 0;
	const accout = [];

	els.panels.forEach (function (panel) {
		const day = { cost: [], costTwo: [], todayTotal: 0 };

		panel.querySelectorAll('.cost').forEach (function (element) {
			const price = Number(element.textContent);
			day.cost.push(price);
			day.todayTotal += price;
		});

		panel.querySelectorAll('.cost-two').forEach (function (element) {
			const price = Number(element.textContent) / 2;
			day.costTwo.push(price);
			day.todayTotal += price;
		});

		accout.push(day);
		total += day.todayTotal;
	});

	console.log(accout);

	els.dayTotals = accout.map(function (day) {
		return day.todayTotal;
	});

	els.total.innerText = total.toLocaleString();
	return total;
};

function init () {
	setElement();
	totalAccout();
	setCostNumber();
	
	activeTabButton();
	activeTabPanel(0);
};

document.addEventListener('DOMContentLoaded', init);