let audioContext;
let gainNode;
let bassEQ, midEQ, trebleEQ, panner;
let soundCounter = 0;
const sounds = {};
let alarmInterval;
let isLooping = false;
let timerTimeout;
let alarmSound = new Audio('/mp3/alarm.mp3');
let isPaused = false;

const musicLibrary = [
    { path: '/mp3/awakening.mp3', name: 'Awakening' },
    { path: '/mp3/etherealEternity.mp3', name: 'Ethereal Eternity' },
    { path: '/mp3/pianoAtNight.mp3', name: 'Piano at Night' },
    { path: 'random', name: 'Véletlenszerű (Jamendo)' }
];

const soundLibrary = [
    { id: 'heavy-rain', path: '/sounds/heavy-rain.mp3', name: 'Heavy Rain' },
    { id: 'bells-tibetan', path: '/sounds/bells-tibetan.mp3', name: 'Bells Tibetan Large' },
    { id: 'large-waterfall', path: '/sounds/large_waterfall_1.mp3', name: 'Large Waterfall' },
    { id: 'random', path: 'random', name: 'Véletlenszerű (Jamendo)' }
];

function initializeAudioContext() {
    if (!audioContext) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();

        bassEQ = new BiquadFilterNode(audioContext, {
            type: 'lowshelf',
            frequency: 150,
            gain: 0
        });
        midEQ = new BiquadFilterNode(audioContext, {
            type: 'peaking',
            frequency: 1000,
            gain: 0
        });
        trebleEQ = new BiquadFilterNode(audioContext, {
            type: 'highshelf',
            frequency: 3000,
            gain: 0
        });
        panner = new StereoPannerNode(audioContext, {
            pan: 0
        });

        masterGainNode.connect(bassEQ);
        bassEQ.connect(midEQ);
        midEQ.connect(trebleEQ);
        trebleEQ.connect(panner);
        panner.connect(audioContext.destination);
    }
}

async function loadAudioBuffer(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading audio buffer:', error);
        alert('Nem sikerült betölteni a hangfájlt.');
        return null;
    }
}

// Globális változó a tárolt zenék számára
let storedTracks = [];

async function fetchNewTracks() {
    try {
        const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=c1c492b0&format=json&limit=5&fuzzytags=ambient,calm&speed=verylow&include=musicinfo&order=releasedate_desc&vocalinstrumental=instrumental&audioformat=mp32`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results;
        }
    } catch (error) {
        console.error('Hiba történt a zenék betöltése közben:', error);
    }
    return [];
}

async function addNewSound() {
    initializeAudioContext();

    soundCounter++;
    const selectedAudioPath = document.getElementById('audioLibrary').value;
    
    if (selectedAudioPath === 'random') {
        if (storedTracks.length <= 1) {
            const newTracks = await fetchNewTracks();
            storedTracks = [...storedTracks, ...newTracks];
        }

        if (storedTracks.length > 0) {
            const newTrack = storedTracks.shift();
            try {
                const soundBuffer = await loadAudioBuffer(newTrack.audio);
                if (!soundBuffer) return;

                const audioSource = audioContext.createBufferSource();
                audioSource.buffer = soundBuffer;
                audioSource.loop = isLooping;

                const individualGainNode = audioContext.createGain();
                individualGainNode.gain.value = 0.5;

                audioSource.connect(individualGainNode);
                individualGainNode.connect(masterGainNode);
                audioSource.start();

                sounds[`sound${soundCounter}`] = {
                    buffer: soundBuffer,
                    source: audioSource,
                    gain: individualGainNode,
                    name: newTrack.name
                };

                addSoundControlsToUI(newTrack.name, soundCounter);

                // Ha ez az utolsó előtti dal, kérjünk le újabb 5-öt
                if (storedTracks.length === 1) {
                    const newTracks = await fetchNewTracks();
                    storedTracks = [...storedTracks, ...newTracks];
                }
            } catch (error) {
                console.error('Hiba történt a zene betöltése közben:', error);
            }
        } else {
            console.error('Nem sikerült új zenét betölteni a Jamendo-ról');
            alert('Nem sikerült új zenét betölteni. Kérjük, próbálja újra!');
        }
    } else {
        // Eredeti funkcionalitás megtartása
        if (!selectedAudioPath) {
            alert('Válassz egy hangot vagy zenét!');
            return;
        }

        const soundBuffer = await loadAudioBuffer(selectedAudioPath);
        if (!soundBuffer) return;

        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = soundBuffer;
        audioSource.loop = isLooping;

        const individualGainNode = audioContext.createGain();
        individualGainNode.gain.value = 0.5;

        audioSource.connect(individualGainNode);
        individualGainNode.connect(masterGainNode);
        audioSource.start();

        sounds[`sound${soundCounter}`] = {
            buffer: soundBuffer,
            source: audioSource,
            gain: individualGainNode,
            name: document.querySelector(`#audioLibrary option[value="${selectedAudioPath}"]`).textContent
        };

        addSoundControlsToUI(sounds[`sound${soundCounter}`].name, soundCounter);
    }
}

function populateAudioLibrary(type) {
    const selectElement = document.getElementById('audioLibrary');
    selectElement.innerHTML = '<option value="" disabled selected>Válassz egy hangot vagy zenét...</option>';

    let library = type === 'music' ? musicLibrary : soundLibrary;

    library.forEach(audio => {
        let option = document.createElement('option');
        option.value = audio.path;
        option.textContent = audio.name;
        selectElement.appendChild(option);
    });
}

document.getElementById('soundOrMusicSelector').addEventListener('change', (event) => {
    populateAudioLibrary(event.target.value);
});

function addSoundControlsToUI(name, counter) {
    const soundDiv = document.createElement('div');
    soundDiv.className = 'sound';

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `sound${counter}`;
    checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${name}`));
    soundDiv.appendChild(label);

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.01';
    volumeSlider.id = `volume${counter}`;
    volumeSlider.value = '0.5';
    volumeSlider.addEventListener('input', () => adjustVolume(counter));
    soundDiv.appendChild(volumeSlider);

    document.getElementById('soundsContainer').appendChild(soundDiv);

    checkbox.addEventListener('change', () => toggleSound(`sound${counter}`));
}

function toggleSound(soundId) {
    const sound = sounds[soundId];
    const checkbox = document.getElementById(soundId);

    if (checkbox.checked) {
        if (!sound.source) {
            const source = audioContext.createBufferSource();
            source.buffer = sound.buffer;
            source.loop = isLooping;
            source.connect(sound.gain);
            sound.gain.connect(masterGainNode);
            source.start();
            sound.source = source;
        }
    } else if (sound.source) {
        sound.source.stop();
        sound.source.disconnect();
        sound.source = null;
    }
}

function adjustVolume(soundId) {
    const volumeSlider = document.getElementById(`volume${soundId}`);
    if (sounds[`sound${soundId}`]) {
        sounds[`sound${soundId}`].gain.gain.value = parseFloat(volumeSlider.value);
    } else {
        console.error(`Sound with ID sound${soundId} not found!`);
    }
}

function adjustEqualizer(type) {
    const value = document.getElementById(type).value;
    switch (type) {
        case 'bass':
            bassEQ.gain.value = (value - 1) * 40;
            break;
        case 'mid':
            midEQ.gain.value = (value - 1) * 15;
            break;
        case 'treble':
            trebleEQ.gain.value = (value - 1) * 40;
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
        if (sounds[sound].source) {
            sounds[sound].source.playbackRate.value = rate;
        }
    }
    document.getElementById('currentRate').textContent = rate + 'x';
}

function setTimer() {
    const minutes = parseInt(document.getElementById('timerValue').value);
    if (isNaN(minutes) || minutes <= 0) {
        alert('Adj meg egy érvényes időtartamot percekben!');
        return;
    }

    if (timerTimeout) {
        clearTimeout(timerTimeout);
    }

    const duration = minutes * 60 * 1000;
    timerTimeout = setTimeout(stopAllSounds, duration);
    alert(`${minutes} perc múlva az összes hang leáll!`);
}

function setAlarm() {
    const currentTime = new Date();
    const inputTime = document.getElementById('alarmTime').value.split(":");
    if (!inputTime || inputTime.length !== 2) {
        alert('Érvényes időpontot kell megadni!');
        return;
    }
    const alarmTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), parseInt(inputTime[0]), parseInt(inputTime[1]));

    if (alarmTime <= currentTime) {
        alert('A beállított időpontnak a jövőben kell lennie!');
        return;
    }

    if (alarmInterval) {
        clearInterval(alarmInterval);
    }

    alarmInterval = setInterval(() => {
        const now = new Date();
        if (now >= alarmTime) {
            alarmSound.play();
            $('#alarmModal').modal('show');
            clearInterval(alarmInterval);
        }
    }, 1000);
}

function stopAlarm() {
    if (alarmSound && !alarmSound.paused) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    $('#alarmModal').modal('hide');
}

function stopAllSounds() {
    const stopAllButton = document.getElementById('stopAllSounds');

    if (!isPaused) {
        for (const soundId in sounds) {
            if (sounds[soundId].source) {
                sounds[soundId].source.stop();
                sounds[soundId].source.disconnect();
                sounds[soundId].source = null;
            }
        }
        isPaused = true;
        stopAllButton.textContent = "Összes hang újraindítása";
    } else {
        for (const soundId in sounds) {
            if (!sounds[soundId].source) {
                const source = audioContext.createBufferSource();
                source.buffer = sounds[soundId].buffer;
                source.loop = isLooping;
                source.connect(sounds[soundId].gain);
                source.start();
                sounds[soundId].source = source;
            }
        }
        isPaused = false;
        stopAllButton.textContent = "Összes hang stop";
    }
}

function toggleLoop() {
    isLooping = !isLooping;
    document.getElementById('loopStatus').textContent = isLooping ? 'BE' : 'KI';

    for (const soundId in sounds) {
        if (sounds[soundId].source) {
            sounds[soundId].source.loop = isLooping;
        }
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

async function setBackground() {
    const selectedBackground = document.getElementById('backgroundSelector').value;
    
    if (selectedBackground === 'random') {
        try {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const randomId = Math.floor(Math.random() * 1000);
            const imageUrl = `https://picsum.photos/id/${randomId}/${width}/${height}`;
            
            const response = await fetch(imageUrl);
            if (response.ok) {
                document.body.style.backgroundImage = `url('${imageUrl}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
            } else {
                console.error('Nem sikerült képet betölteni a Picsum Photos-ról');
            }
        } catch (error) {
            console.error('Hiba történt a háttérkép betöltése közben:', error);
        }
    } else {
        // Eredeti funkcionalitás megtartása
        document.body.style.backgroundImage = `url('image/${selectedBackground}.jpg')`;
    }
}

// Eseménykezelő hozzáadása a háttérváltó gombhoz
document.getElementById('changeBackground').addEventListener('click', () => {
    document.getElementById('backgroundSelector').value = 'random';
    setBackground();
});

// Az eredeti eseménykezelő megtartása
document.getElementById('backgroundSelector').addEventListener('change', setBackground);

function adjustMasterVolume() {
    const volumeSlider = document.getElementById('volumeControl');
    const volume = parseFloat(volumeSlider.value);
    masterGainNode.gain.value = volume;

    document.getElementById('volumeValue').textContent = `${Math.round(volume * 100)}%`;
}

window.onload = function () {
    initializeAudioContext();
    populateSelectOptions();
    loadSettings();
    setBackground();

    document.getElementById('setAlarm').addEventListener('click', setAlarm);
    document.getElementById('stopAlarm').addEventListener('click', stopAlarm);
    document.getElementById('stopAlarmFromModal').addEventListener('click', stopAlarm);
    document.getElementById('setTimer').addEventListener('click', setTimer);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('loadSettings').addEventListener('click', loadSettings);
    document.getElementById('randomizeSounds').addEventListener('click', randomizeSounds);
    document.getElementById('toggleLoop').addEventListener('click', toggleLoop);
    document.getElementById('backgroundSelector').addEventListener('change', setBackground);
    document.getElementById('pan').addEventListener('input', adjustPan);
    document.getElementById('addNewAudio').addEventListener('click', addNewSound);
    document.getElementById('stopAllSounds').addEventListener('click', stopAllSounds);
    document.getElementById('volumeControl').addEventListener('input', adjustMasterVolume);
    document.getElementById('toggleDarkMode').addEventListener('click', function () {
        const bodyElement = document.body;
        bodyElement.classList.toggle('dark-mode');

        const darkModeEnabled = bodyElement.classList.contains('dark-mode');
        this.textContent = darkModeEnabled ? 'Sötét Mód Ki' : 'Sötét Mód Be';
    });

    document.getElementById('setTimer').addEventListener('click', setTimer);
    document.getElementById('backgroundSelector').addEventListener('change', setBackground);
};

function randomizeSettings() {
    const randomBass = Math.random() * 2;
    const randomMid = Math.random() * 2;
    const randomTreble = Math.random() * 2;
    const randomPan = (Math.random() * 2) - 1;
    const randomPlaybackRate = (Math.random() * 1.5) + 0.5;

    document.getElementById('bass').value = randomBass;
    document.getElementById('mid').value = randomMid;
    document.getElementById('treble').value = randomTreble;
    document.getElementById('pan').value = randomPan;
    document.getElementById('playbackRate').value = randomPlaybackRate;

    adjustEqualizer('bass');
    adjustEqualizer('mid');
    adjustEqualizer('treble');
    adjustPan();
    adjustPlaybackRate();

    console.log(`Randomized settings: Bass: ${randomBass}, Mid: ${randomMid}, Treble: ${randomTreble}, Pan: ${randomPan}, Playback Rate: ${randomPlaybackRate}`);
}

function randomizeSounds() {
    // Véletlenszerűen válasszunk és játsszunk le hangokat
    const availableSounds = [...musicLibrary, ...soundLibrary];
    const randomSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
    
    document.getElementById('audioLibrary').value = randomSound.path;
    addNewSound();
}

document.getElementById('randomizeSounds').addEventListener('click', randomizeSettings);

function populateSelectOptions() {
    populateAudioLibrary('music');
}

populateSelectOptions();