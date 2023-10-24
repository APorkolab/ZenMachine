let soundCounter = 0;
const sounds = {};
const audioContext = new(window.AudioContext || window.webkitAudioContext)();

const gainNode = audioContext.createGain();
const bassEQ = audioContext.createBiquadFilter();
const midEQ = audioContext.createBiquadFilter();
const trebleEQ = audioContext.createBiquadFilter();
let panner = audioContext.createPanner();
let isLooping = false;

bassEQ.type = "lowshelf";
bassEQ.frequency.value = 150;
bassEQ.gain.value = 0;

midEQ.type = "peaking";
midEQ.frequency.value = 1000;
midEQ.gain.value = 0;

trebleEQ.type = "highshelf";
trebleEQ.frequency.value = 3000;
trebleEQ.gain.value = 0;

bassEQ.connect(midEQ);
midEQ.connect(trebleEQ);
trebleEQ.connect(panner);
panner.connect(audioContext.destination);

const soundLibrary = [{
		path: '/sounds/heavy-rain.mp3',
		name: 'Heavy Rain'
	},
	{
		path: '/sounds/bells-tibetan.mp3',
		name: 'Bells Tibetan Large'
	},
	{
		path: '/sounds/large_waterfall_1.mp3',
		name: 'Large Waterfall'
	},
];


function addNewSound() {
	soundCounter++;

	// Véletlenszerű hang kiválasztása a tömbből
	const randomIndex = Math.floor(Math.random() * soundLibrary.length);
	const selectedSound = soundLibrary[randomIndex];

	// HTML elemek létrehozása
	const soundDiv = document.createElement('div');
	soundDiv.className = 'sound';

	const label = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.id = `sound${soundCounter}`;
	checkbox.onclick = function () {
		toggleSound(`sound${soundCounter}`);
	};
	label.appendChild(checkbox);
	label.innerHTML += ` ${selectedSound.name}`;
	soundDiv.appendChild(label);

	const volumeSlider = document.createElement('input');
	volumeSlider.type = 'range';
	volumeSlider.min = '0';
	volumeSlider.max = '1';
	volumeSlider.step = '0.01';
	volumeSlider.id = `volume${soundCounter}`;
	volumeSlider.oninput = function () {
		adjustVolume(`sound${soundCounter}`);
	};
	volumeSlider.value = '0.5';
	soundDiv.appendChild(volumeSlider);

	document.getElementById('soundsContainer').appendChild(soundDiv);

	// Audio objektum létrehozása
	const audio = new Audio(selectedSound.path);
	audio.loop = true; // Folyamatos ismétlés beállítása


	// Audio csatlakoztatása az audio kontexthez
	const track = audioContext.createMediaElementSource(audio);
	track.connect(bassEQ);

	sounds[`sound${soundCounter}`] = audio;
}

document.addEventListener('click', function () {
	if (audioContext.state === 'suspended') {
		audioContext.resume().then(() => {
			console.log('AudioContext successfully resumed!');
		}).catch((error) => {
			console.error('Failed to resume AudioContext:', error);
		});
	}
});



function toggleSound(soundId) {
	const audio = sounds[soundId];
	if (audio.paused) {
		audio.play();
		audio.resume();
	} else {
		audio.pause();
	}
}

function adjustVolume(soundId) {
	const volumeSlider = document.getElementById(`volume${soundId.charAt(soundId.length-1)}`);
	sounds[soundId].volume = volumeSlider.value;
}

function stopAllSounds() {
	for (const sound in sounds) {
		sounds[sound].pause();
		sounds[sound].currentTime = 0;
		document.getElementById(sound).checked = false;
	}
}

function adjustEqualizer(type) {
	const value = document.getElementById(type).value;
	switch (type) {
		case 'bass':
			bassEQ.gain.value = (value - 1) * 40; // -40 to +40 dB range
			break;
		case 'mid':
			midEQ.gain.value = (value - 1) * 15; // -15 to +15 dB range
			break;
		case 'treble':
			trebleEQ.gain.value = (value - 1) * 40; // -40 to +40 dB range
			break;
	}
}

function adjustPan() {
	const value = document.getElementById('pan').value;
	panner.pan.value = value;
}

// Kezdeti hangok hozzáadása
for (let i = 0; i < 3; i++) {
	addNewSound();
}

function adjustPlaybackRate() {
	const rate = document.getElementById('playbackRate').value;
	for (const sound in sounds) {
		sounds[sound].playbackRate = rate;
	}
}

function saveSettings() {
	const settings = {
		sounds: sounds,
		bass: document.getElementById('bass').value,
		mid: document.getElementById('mid').value,
		treble: document.getElementById('treble').value,
		pan: document.getElementById('pan').value,
		playbackRate: document.getElementById('playbackRate').value
	};
	localStorage.setItem('zenGepeSettings', JSON.stringify(settings));
	alert('Beállítások mentve!');
}

function loadSettings() {
	const savedSettings = JSON.parse(localStorage.getItem('zenGepeSettings'));
	if (!savedSettings) {
		alert('Nincsenek mentett beállítások!');
		return;
	}

	// Hangok visszaállítása
	for (const sound in savedSettings.sounds) {
		sounds[sound].src = savedSettings.sounds[sound].src;
		sounds[sound].volume = savedSettings.sounds[sound].volume;
	}

	// Equalizer és egyéb beállítások visszaállítása
	document.getElementById('bass').value = savedSettings.bass;
	document.getElementById('mid').value = savedSettings.mid;
	document.getElementById('treble').value = savedSettings.treble;
	document.getElementById('pan').value = savedSettings.pan;
	document.getElementById('playbackRate').value = savedSettings.playbackRate;

	adjustEqualizer('bass');
	adjustEqualizer('mid');
	adjustEqualizer('treble');
	adjustPan();
	adjustPlaybackRate();

	alert('Beállítások betöltve!');
}

function randomizeSounds() {
	const soundKeys = Object.keys(sounds);
	soundKeys.forEach(key => {
		const randomVolume = Math.random();
		sounds[key].volume = randomVolume;
	});
	alert('Véletlenszerű hangok beállítva!');
}

function toggleLoop() {
	isLooping = !isLooping;
	for (const sound in sounds) {
		sounds[sound].loop = isLooping;
	}
	document.getElementById('loopStatus').textContent = isLooping ? 'BE' : 'KI';
}

document.getElementById('toggleDarkMode').addEventListener('click', function () {
	document.body.classList.toggle('dark-mode');
});

document.getElementById('setTimer').addEventListener('click', function () {
	let minutes = document.getElementById('timerValue').value;
	setTimeout(function () {
		stopAllSounds();
	}, minutes * 60 * 1000);
});

document.getElementById('backgroundSelector').addEventListener('change', function () {
	let selectedBackground = this.value;
	document.body.style.backgroundImage = `url('images/${selectedBackground}.jpg')`;
});

document.getElementById('setAlarm').addEventListener('click', function () {
	let alarmTime = new Date(document.getElementById('alarmTime').value);
	let now = new Date();
	let timeToAlarm = alarmTime.getTime() - now.getTime();
	if (timeToAlarm < 0) {
		alert('Az ébresztő időpontja nem lehet a jelen időpont előtt!');
		return;
	}
	setTimeout(function () {
		// Itt játssza le az ébresztő hangot
	}, timeToAlarm);
});

document.getElementById('playbackRate').addEventListener('input', function () {
	let rate = this.value;
	document.getElementById('audioElement').playbackRate = rate;
	document.getElementById('currentRate').textContent = rate + 'x';
});

document.getElementById('backgroundNoise').addEventListener('change', function () {
	let noise = this.value;
	let audio = document.getElementById('audioElement');
	audio.src = 'path_to_audio_files/' + noise + '.mp3';
	audio.play();
});


panner.panningModel = 'HRTF';
panner.distanceModel = 'inverse';
panner.refDistance = 1;
panner.maxDistance = 10000;
panner.rolloffFactor = 1;
panner.coneInnerAngle = 360;
panner.coneOuterAngle = 0;
panner.coneOuterGain = 0;
panner.setPosition(0, 0, 0);

let source = audioContext.createBufferSource();
source.connect(panner);
panner.connect(audioContext.destination);

function autoMix() {
	let tracks = [track1, track2, track3]; // feltételezve, hogy ezek az audio sávok
	let randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
	randomTrack.play();
}

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js')
		.then(function (registration) {
			console.log('Service Worker regisztrálva a következő hatókörrel:', registration.scope);
		})
		.catch(function (error) {
			console.log('Service Worker regisztráció sikertelen:', error);
		});
}