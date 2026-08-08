/**
 * Loads every element with a `data-include="path/to/file.html"` attribute
 * by fetching that file and injecting it as innerHTML.
 *
 * Place this script tag *after* the elements it targets so they already
 * exist in the DOM, and *before* any script that depends on the injected
 * content. Other scripts can await `window.includesReady` to run only
 * once all includes have finished loading.
 */
window.includesReady = (function () {
	var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));

	var tasks = nodes.map(function (el) {
		var src = el.getAttribute('data-include');

		return fetch(src)
			.then(function (response) {
				if (!response.ok) {
					throw new Error('Failed to load ' + src + ' (' + response.status + ')');
				}
				return response.text();
			})
			.then(function (html) {
				el.innerHTML = html;
			})
			.catch(function (error) {
				console.error(error);
			});
	});

	return Promise.all(tasks);
})();
