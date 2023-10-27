let soundCounter = 1;
const sounds = {};
let alarmInterval;
let lastPlayedTrack = null;
let gainNode, bassEQ, midEQ, trebleEQ, panner;
var audioContext = new AudioContext();

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
		gainNode.gain.value = 1; // Ezzel biztosítjuk, hogy van kezdeti hang

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

		audioSource.connect(gainNode);
		gainNode.connect(bassEQ);
		bassEQ.connect(midEQ);
		midEQ.connect(trebleEQ);
		trebleEQ.connect(panner);
		panner.connect(audioContext.destination);
	}
}

document.getElementById('startAudio').addEventListener('click', function () {
	initializeAudioContext();
	// Kezdeti hangok hozzáadása
	for (let i = 0; i < 3; i++) {
		addNewSound();
	}
});


document.addEventListener('click', function () {
	initializeAudioContext();

	if (audioContext.state === 'suspended') {
		audioContext.resume().then(() => {
			console.log('AudioContext successfully resumed!');
		}).catch((error) => {
			console.error('Failed to resume AudioContext:', error);
		});
	}

	// További kódok...
});

let isLooping = false;

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
	}
];


async function addNewSound() {
	initializeAudioContext();

	const randomIndex = Math.floor(Math.random() * soundLibrary.length);
	const selectedSound = soundLibrary[randomIndex];

	const soundBuffer = await loadAudioBuffer(selectedSound.path);
	const audioSource = audioContext.createBufferSource();
	audioSource.buffer = soundBuffer;
	audioSource.connect(audioContext.destination);
	audioSource.start();
	audioSource.loop = true;

	sounds[`sound${soundCounter}`] = {
		buffer: soundBuffer,
		source: null
	};

	// HTML elemek létrehozása
	const soundDiv = document.createElement('div');
	soundDiv.className = 'sound';

	const label = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.id = `sound${soundCounter}`;
	label.appendChild(checkbox);
	label.innerHTML += ` ${selectedSound.name}`;
	soundDiv.appendChild(label);
	soundCounter++;

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

	checkbox.onclick = function () {
		toggleSound(`sound${soundCounter}`);
	};
}

function toggleSound(soundId) {
	audioContext.resume().then(() => { // Az audioContext.resume használata
		const audioData = sounds[soundId];

		if (!audioData.source) { // Ha még nincs source, vagy megszakítottuk
			// Létrehozunk egy új AudioBufferSourceNode-t
			audioData.source = audioContext.createBufferSource();
			audioData.source.buffer = audioData.buffer;
			audioData.source.connect(gainNode);
			audioData.source.loop = true;
			audioData.source.start();
		} else {
			// Megszakítjuk a jelenlegi AudioBufferSourceNode-t
			audioData.source.stop();
			audioData.source = null; // Nullázzuk, hogy jelezzük, hogy megszakítottuk
		}
	}).catch((error) => {
		console.error('Failed to resume AudioContext:', error);
	});
}

function adjustVolume(soundId) {
	const volumeSlider = document.getElementById(soundId.replace('sound', 'volume'));
	if (sounds[soundId] && sounds[soundId].source) {
		sounds[soundId].source.gain.value = volumeSlider.value; // Alkalmazza a hangerő változását
	} else {
		console.error(`Sound with ID ${soundId} not found!`);
	}
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
	localStorage.setItem('zenGepeSettings', JSON.stringify(settings));
	alert('Beállítások mentve!');
}

function loadSettings() {
	const savedSettings = JSON.parse(localStorage.getItem('zenGepeSettings')) || defaultSettings;
	if (!savedSettings) {
		alert('Nincsenek mentett beállítások!');
		return;
	}

	function resumeAudioContext() {
		if (audioContext.state === 'suspended') {
			return audioContext.resume();
		}
		return Promise.resolve();
	}


	// Hangok visszaállítása (ezek nem voltak elmentve a localStorage-ban, csak a beállítások)
	for (const sound in sounds) {
		if (sounds[sound]) {
			sounds[sound].playbackRate = savedSettings.playbackRate || 1;
		}
	}

	// Equalizer és egyéb beállítások visszaállítása
	document.getElementById('bass').value = savedSettings.bass || 0;
	document.getElementById('mid').value = savedSettings.mid || 0;
	document.getElementById('treble').value = savedSettings.treble || 0;
	document.getElementById('pan').value = savedSettings.pan || 0;
	document.getElementById('playbackRate').value = savedSettings.playbackRate || 1;

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
		alert('Az időzítő lejárt és az összes hangot megállítottam!');
	}, minutes * 60 * 1000);
});

document.getElementById('backgroundSelector').addEventListener('change', function () {
	let selectedBackground = this.value;
	document.body.style.backgroundImage = `url('images/${selectedBackground}.jpg')`;
});

document.getElementById('setAlarm').addEventListener('click', function () {
	let alarmTime = new Date(document.getElementById('alarmTime').value);

	if (alarmInterval) { // Ha már van beállított ébresztő, akkor töröljük azt
		clearInterval(alarmInterval);
	}

	alarmInterval = setInterval(function () {
		let now = new Date();
		if (now >= alarmTime) {
			// Itt játssza le az ébresztő hangot
			clearInterval(alarmInterval); // ne ellenőrizze tovább
		}
	}, 60 * 1000); // percenként ellenőrzi
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


// panner.panningModel = 'HRTF';
// panner.distanceModel = 'inverse';
// panner.refDistance = 1;
// panner.maxDistance = 10000;
// panner.rolloffFactor = 1;
// panner.coneInnerAngle = 360;
// panner.coneOuterAngle = 0;
// panner.coneOuterGain = 0;
// panner.setPosition(0, 0, 0);

// let source = audioContext.createBufferSource();
// source.connect(panner);
// panner.connect(audioContext.destination);

function autoMix() {
	let tracks = [track1, track2, track3];

	let availableTracks = tracks.filter(track => track !== lastPlayedTrack); // Az utoljára lejátszott audiosávot kizárjuk
	let randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

	randomTrack.play();
	lastPlayedTrack = randomTrack;
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