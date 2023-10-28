var audioContext = new AudioContext();
let soundCounter = 1;
const sounds = {};
let alarmInterval;
let lastPlayedTrack = null;
let gainNode;
let alarmSound = new Audio('/mp3/alarm.mp3');
let autoMixInterval;

let bassEQ = new BiquadFilterNode(audioContext, {
	type: 'lowshelf',
	frequency: 150,
	gain: 0
});

let midEQ = new BiquadFilterNode(audioContext, {
	type: 'peaking',
	frequency: 1000,
	gain: 0
});

let trebleEQ = new BiquadFilterNode(audioContext, {
	type: 'highshelf',
	frequency: 3000,
	gain: 0
});

let panner = new StereoPannerNode(audioContext, {
	pan: 0
});


const defaultSettings = {
	bass: 0,
	mid: 0,
	treble: 0,
	pan: 0,
	playbackRate: 1
};

async function loadAudioBuffer(url) {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	return audioBuffer;
}

function initializeAudioContext() {
	if (!audioContext) {
		audioContext = new(window.AudioContext || window.webkitAudioContext)();

		gainNode = audioContext.createGain();
		//gainNode.gain.value = 1; // Ezzel biztosítjuk, hogy van kezdeti hang

		bassEQ = audioContext.createBiquadFilter();
		midEQ = audioContext.createBiquadFilter();
		trebleEQ = audioContext.createBiquadFilter();
		panner = audioContext.createPanner();
		gainNode.connect(audioContext.destination);

		bassEQ.type = "lowshelf";
		bassEQ.frequency.value = 150;
		bassEQ.gain.value = 0;

		midEQ.type = "peaking";
		midEQ.frequency.value = 1000;
		midEQ.gain.value = 0;

		trebleEQ.type = "highshelf";
		trebleEQ.frequency.value = 3000;
		trebleEQ.gain.value = 0;

		gainNode.connect(bassEQ);
		bassEQ.connect(midEQ);
		midEQ.connect(trebleEQ);
		trebleEQ.connect(panner);
		panner.connect(audioContext.destination);
	}
}

document.addEventListener('click', function () {
	initializeAudioContext();

	if (audioContext.state === 'suspended') {
		audioContext.resume().then(() => {
			console.log('AudioContext successfully resumed!');
		}).catch((error) => {
			console.error('Failed to resume AudioContext:', error);
		});
	}

});

let isLooping = false;

const musicLibrary = [{
		path: '/mp3/awakening.mp3',
		name: 'Awakening'
	},
	{
		path: '/mp3/etherealEternity.mp3',
		name: 'Ethereal Eternity'
	},
	{
		path: '/mp3/pianoAtNight.mp3',
		name: 'Piano at Night'
	}
];

const soundLibrary = [{
		id: 'heavy-rain',
		path: '/sounds/heavy-rain.mp3',
		name: 'Heavy Rain'
	},
	{
		id: 'bells-tibetan',
		path: '/sounds/bells-tibetan.mp3',
		name: 'Bells Tibetan Large'
	},
	{
		id: 'large-waterfall',
		path: '/sounds/large_waterfall_1.mp3',
		name: 'Large Waterfall'
	}
];

function populateSelectOptions() {
	const selectElement = document.getElementById('backgroundNoise');

	soundLibrary.forEach(sound => {
		let option = document.createElement('option');
		option.value = sound.id;
		option.textContent = sound.name;
		selectElement.appendChild(option);
	});
}

// Eseménykezelő a Leállítás/Újraindítás gombhoz
document.getElementById('toggleAudio').addEventListener('click', function () {
	const audio = document.getElementById('audioElement');

	if (audio.paused) {
		audio.play();
	} else {
		audio.pause();
	}
});

document.getElementById('volumeControl').addEventListener('input', function () {
	const audio = document.getElementById('audioElement');
	audio.volume = this.value; // Frissíti az audió hangerőt a csúszka értékével
});

document.getElementById('backgroundNoise').addEventListener('change', function () {
	let selectedNoiseId = this.value;
	let audio = document.getElementById('audioElement');
	let selectedSound = soundLibrary.find(sound => sound.id === selectedNoiseId);

	if (selectedSound) {
		audio.src = selectedSound.path;
		audio.play();
	}
});

populateSelectOptions();


let currentIndex = 0;

function getNextSound() {
	const selectedSound = musicLibrary[currentIndex];
	currentIndex = (currentIndex + 1) % musicLibrary.length;
	return selectedSound;
}

async function addNewSound() {
	soundCounter++;
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}

	initializeAudioContext();

	const selectedSound = getNextSound();

	const soundBuffer = await loadAudioBuffer(selectedSound.path);
	const audioSource = audioContext.createBufferSource();
	audioSource.buffer = soundBuffer;

	const gainNode = audioContext.createGain();

	audioSource.connect(gainNode);
	gainNode.connect(bassEQ);
	bassEQ.connect(midEQ);
	midEQ.connect(trebleEQ);
	trebleEQ.connect(panner);
	panner.connect(audioContext.destination);

	audioSource.start();
	audioSource.loop = true;

	sounds[`sound${soundCounter}`] = {
		buffer: soundBuffer,
		source: audioSource,
		gain: gainNode
	};

	// HTML elemek létrehozása
	const soundDiv = document.createElement('div');
	soundDiv.className = 'sound';

	const label = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.id = `sound${soundCounter}`;
	checkbox.checked = true; // Bejelöljük a checkboxot
	label.appendChild(checkbox);
	const textNode = document.createTextNode(` ${selectedSound.name}`);
	label.appendChild(textNode);
	soundDiv.appendChild(label);

	const volumeSlider = document.createElement('input');
	volumeSlider.type = 'range';
	volumeSlider.min = '0';
	volumeSlider.max = '1';
	volumeSlider.step = '0.01';
	volumeSlider.id = `volume${soundCounter}`;
	volumeSlider.oninput = (function (currentCounter) {
		return function () {
			adjustVolume(`sound${currentCounter}`);
		};
	})(soundCounter);
	volumeSlider.value = '0.5';
	soundDiv.appendChild(volumeSlider);

	document.getElementById('soundsContainer').appendChild(soundDiv);

	const currentSoundId = `sound${soundCounter}`;
	checkbox.onclick = function () {
		toggleSound(currentSoundId);
	};
}

function toggleSound(soundId) {
	audioContext.resume().then(() => {
		const audioData = sounds[soundId];
		const checkbox = document.getElementById(soundId);

		if (checkbox.checked) {
			// Létrehozunk egy új AudioBufferSourceNode-ot
			const source = audioContext.createBufferSource();
			source.buffer = audioData.buffer;
			source.connect(audioData.gain);
			source.loop = true;
			source.start();

			// Mentsük el a mostani source referenciát az audioData objektumban
			audioData.source = source;

		} else {
			// Ha a checkbox nincs bepipálva és van egy aktív forrás, akkor azt megállítjuk
			if (audioData.source) {
				audioData.source.stop();
				audioData.source.disconnect(audioData.gain);
				audioData.source = null;
			}
		}
	}).catch((error) => {
		console.error('Failed to resume AudioContext:', error);
	});
}

function adjustVolume(soundId) {
	const volumeSlider = document.getElementById(soundId.replace('sound', 'volume'));
	if (sounds[soundId] && sounds[soundId].gain) {
		sounds[soundId].gain.gain.value = parseFloat(volumeSlider.value);
	} else {
		console.error(`Sound with ID ${soundId} not found!`);
	}
}

function stopAllSounds() {
	for (const sound in sounds) {
		if (sounds[sound].source) {
			sounds[sound].source.stop();
			sounds[sound].source = null;
		}
		document.getElementById(sound).checked = false;
	}

	// Leállítja a háttérzajt és visszaállítja a kezdeti állapotba
	const audio = document.getElementById('audioElement');
	audio.pause();
	audio.currentTime = 0;
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

function adjustPlaybackRate() {
	const rate = document.getElementById('playbackRate').value;
	for (const sound in sounds) {
		sounds[sound].playbackRate = rate;
	}
}

function saveSettings() {
	const settings = {
		bass: document.getElementById('bass').value,
		mid: document.getElementById('mid').value,
		treble: document.getElementById('treble').value,
		pan: document.getElementById('pan').value,
		playbackRate: document.getElementById('playbackRate').value
	};
	localStorage.setItem('audioSettings', JSON.stringify(settings));
	alert('Beállítások mentve!');
}

function loadSettings() {
	const settings = JSON.parse(localStorage.getItem('audioSettings'));
	if (settings) {
		document.getElementById('bass').value = settings.bass;
		document.getElementById('mid').value = settings.mid;
		document.getElementById('treble').value = settings.treble;
		document.getElementById('pan').value = settings.pan;
		document.getElementById('playbackRate').value = settings.playbackRate;

		adjustEqualizer('bass');
		adjustEqualizer('mid');
		adjustEqualizer('treble');
		adjustPan();
		adjustPlaybackRate();
	}
}

function resumeAudioContext() {
	if (audioContext.state === 'suspended') {
		return audioContext.resume();
	}
	return Promise.resolve();
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
		alert('Az időzítő lejárt és az összes hangot megállítottam!');
	}, minutes * 60 * 1000);
});

function setBackground() {
	let selectedBackground = document.getElementById('backgroundSelector').value;
	document.body.style.backgroundImage = `url('image/${selectedBackground}.jpg')`;
}

// Az oldal betöltésekor beállítja az alapértelmezett háttérképet
window.onload = setBackground;

// Eseményhallgatót ad a legördülő menü változásához
document.getElementById('backgroundSelector').addEventListener('change', setBackground);


document.getElementById('setAlarm').addEventListener('click', function () {
	let currentTime = new Date();
	let inputTime = document.getElementById('alarmTime').value.split(":");
	let alarmTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), parseInt(inputTime[0]), parseInt(inputTime[1]));

	// Ellenőrizze, hogy a beállított időpont a jövőben van-e
	if (alarmTime <= currentTime) {
		alert('A beállított időpontnak a jövőben kell lennie!');
		return; // Kilépünk a függvényből, így az ébresztő nem lesz beállítva
	}

	if (alarmInterval) { // Ha már van beállított ébresztő, akkor töröljük azt
		clearInterval(alarmInterval);
	}

	alarmInterval = setInterval(function () {
		let now = new Date();
		if (now >= alarmTime) {
			alarmSound.play();
			$('#alarmModal').modal('show');
			clearInterval(alarmInterval);
		}
	}, 10 * 1000);
});


document.getElementById('stopAlarm').addEventListener('click', function () {
	try {
		if (alarmSound && !alarmSound.paused) {
			alarmSound.pause();
			alarmSound.currentTime = 0;
		}

		if (alarmInterval) {
			clearInterval(alarmInterval);
			alarmInterval = null;
		}
	} catch (error) {
		console.error('Hiba:', error);
	}
});

document.getElementById('stopAlarmFromModal').addEventListener('click', function () {
	if (alarmSound) {
		alarmSound.pause();
		alarmSound.currentTime = 0;
	}
	if (alarmInterval) {
		clearInterval(alarmInterval);
		alarmInterval = null;
	}
	$('#alarmModal').modal('hide'); // Modal elrejtése
});

document.getElementById('playbackRate').addEventListener('input', function () {
	let rate = parseFloat(this.value);

	// Az összes audioSource playbackRate-jének módosítása
	for (const sound in sounds) {
		if (sounds[sound].source) {
			sounds[sound].source.playbackRate.value = rate;
		}
	}

	document.getElementById('currentRate').textContent = rate + 'x';
});

function startAutoMix() {
	if (autoMixInterval) {
		clearInterval(autoMixInterval);
	}
	autoMixInterval = setInterval(() => {
		const randomSound = soundLibrary[Math.floor(Math.random() * soundLibrary.length)];
		document.getElementById('backgroundNoise').value = randomSound.id;
		document.getElementById('backgroundNoise').dispatchEvent(new Event('change'));
	}, 30000); // 30 másodpercenként váltja a hangokat.
}

// if ('serviceWorker' in navigator) {
// 	navigator.serviceWorker.register('/service-worker.js')
// 		.then(function (registration) {
// 			console.log('Service Worker regisztrálva a következő hatókörrel:', registration.scope);
// 		})
// 		.catch(function (error) {
// 			console.log('Service Worker regisztráció sikertelen:', error);
// 		});
// }