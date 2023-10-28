var audioContext = new AudioContext();

let soundCounter = 1;
const sounds = {};
let alarmInterval;
let lastPlayedTrack = null;
let gainNode;

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

document.getElementById('startAudio').addEventListener('click', function () {
	initializeAudioContext();
	// Kezdeti hangok hozzáadása
	for (let i = 0; i < 1; i++) {
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
	soundCounter++;
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}

	initializeAudioContext();

	const randomIndex = Math.floor(Math.random() * soundLibrary.length);
	const selectedSound = soundLibrary[randomIndex];

	const soundBuffer = await loadAudioBuffer(selectedSound.path);
	const audioSource = audioContext.createBufferSource();
	audioSource.buffer = soundBuffer;

	const gainNode = audioContext.createGain();

	// audioSource-t az equalizerhez csatlakoztatjuk
	audioSource.connect(gainNode);
	gainNode.connect(bassEQ);
	bassEQ.connect(midEQ);
	midEQ.connect(trebleEQ);
	// Az utolsó equalizer-t a pannerhez csatlakoztatjuk
	trebleEQ.connect(panner);
	// Végül a panner-t az AudioContext destination-jéhez csatlakoztatjuk

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
	let rate = parseFloat(this.value);

	// Az összes audioSource playbackRate-jének módosítása
	for (const sound in sounds) {
		if (sounds[sound].source) {
			sounds[sound].source.playbackRate.value = rate;
		}
	}

	document.getElementById('currentRate').textContent = rate + 'x';
});


document.getElementById('backgroundNoise').addEventListener('change', function () {
	let noise = this.value;
	let audio = document.getElementById('audioElement');
	audio.src = 'path_to_audio_files/' + noise + '.mp3';
	audio.play();
});

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