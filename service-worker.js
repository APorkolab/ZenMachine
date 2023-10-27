const CACHE_NAME = 'zen-gep-v1';
const urlsToCache = [
	'/',
	'/css/style.css',
	'/js/sound.js',
	'/sounds/bells-tibetan.mp3',
	'/sounds/heavy-rain.mp3',
	// ... többi erőforrás
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(function (cache) {
			console.log('Nyitott cache');
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(
		caches.match(event.request)
		.then(function (response) {
			if (response) {
				return response;
			}
			return fetch(event.request);
		})
	);
});