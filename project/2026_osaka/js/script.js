let els = {};

function setElement () {
	els.buttons = document.querySelectorAll('.tab-list');
	els.panels = document.querySelectorAll('.tabpanel');
	els.panels = document.querySelectorAll('.tabpanel');

	els.cost = document.querySelectorAll('.cost');
	els.total = document.querySelector('.total');
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
};

function setCostNumber () {
	els.cost.forEach (function (element) {
		const price = Number(element.innerText); 
	
		element.innerText = price.toLocaleString();
	});
}

function totalAccout () {
	let total = 0

	els.cost.forEach (function (element) {
		const price = Number(element.textContent); 
		total += price; 
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