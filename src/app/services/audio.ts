import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { moveItemInArray } from '@angular/cdk/drag-drop';

export interface ActiveSound {
  id: string;
  name: string;
  path: string;
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext;
  private masterGainNode: GainNode;
  private bassEQ: BiquadFilterNode;
  private midEQ: BiquadFilterNode;
  private trebleEQ: BiquadFilterNode;
  private panner: StereoPannerNode;
  private analyser: AnalyserNode;
  private sounds = new Map<string, { source: AudioBufferSourceNode, gain: GainNode, name: string, path: string }>();
  private timerTimeout: any;
  private alarmInterval: any;
  private alarmSound: HTMLAudioElement;
  private isLooping = false;
  private soundCounter = 0;

  private activeSoundsSubject = new BehaviorSubject<ActiveSound[]>([]);
  public activeSounds$ = this.activeSoundsSubject.asObservable();
  private masterVolumeSubject = new BehaviorSubject<number>(1);
  public masterVolume$ = this.masterVolumeSubject.asObservable();
  private panSubject = new BehaviorSubject<number>(0);
  public pan$ = this.panSubject.asObservable();
  private bassSubject = new BehaviorSubject<number>(0);
  public bass$ = this.bassSubject.asObservable();
  private midSubject = new BehaviorSubject<number>(0);
  public mid$ = this.midSubject.asObservable();
  private trebleSubject = new BehaviorSubject<number>(0);
  public treble$ = this.trebleSubject.asObservable();

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGainNode = this.audioContext.createGain();

    this.bassEQ = new BiquadFilterNode(this.audioContext, { type: 'lowshelf', frequency: 150, gain: 0 });
    this.midEQ = new BiquadFilterNode(this.audioContext, { type: 'peaking', frequency: 1000, gain: 0 });
    this.trebleEQ = new BiquadFilterNode(this.audioContext, { type: 'highshelf', frequency: 3000, gain: 0 });
    this.panner = new StereoPannerNode(this.audioContext, { pan: 0 });

    this.masterGainNode.connect(this.bassEQ);
    this.bassEQ.connect(this.midEQ);
    this.midEQ.connect(this.trebleEQ);
    this.trebleEQ.connect(this.panner);
    this.analyser = this.audioContext.createAnalyser();
    this.panner.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.alarmSound = new Audio('/assets/mp3/alarm.mp3');
  }

  public getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  async loadSound(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  playSound(name: string, path: string, buffer: AudioBuffer) {
    const id = `${path}-${this.soundCounter++}`;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = this.isLooping;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.5;

    source.connect(gainNode);
    gainNode.connect(this.masterGainNode);
    source.start();

    this.sounds.set(id, { source, gain: gainNode, name, path });
    this.updateActiveSounds();
  }

  stopSound(id: string) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.source.stop();
      sound.source.disconnect();
      this.sounds.delete(id);
      this.updateActiveSounds();
    }
  }

  setVolume(id: string, volume: number) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.gain.gain.value = volume;
    }
  }

  setMasterVolume(volume: number) {
    this.masterGainNode.gain.value = volume;
    this.masterVolumeSubject.next(volume);
  }

  setEQ(type: 'bass' | 'mid' | 'treble', value: number) {
    switch (type) {
      case 'bass':
        this.bassEQ.gain.value = value;
        this.bassSubject.next(value);
        break;
      case 'mid':
        this.midEQ.gain.value = value;
        this.midSubject.next(value);
        break;
      case 'treble':
        this.trebleEQ.gain.value = value;
        this.trebleSubject.next(value);
        break;
    }
  }

  setPan(pan: number) {
    this.panner.pan.value = pan;
    this.panSubject.next(pan);
  }

  setPlaybackRate(rate: number) {
    for (const sound of this.sounds.values()) {
      sound.source.playbackRate.value = rate;
    }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    for (const sound of this.sounds.values()) {
      sound.source.loop = this.isLooping;
    }
    return this.isLooping;
  }

  stopAllSounds() {
    for (const id of this.sounds.keys()) {
      this.stopSound(id);
    }
  }

  setTimer(minutes: number) {
    if (this.timerTimeout) {
      clearTimeout(this.timerTimeout);
    }
    const duration = minutes * 60 * 1000;
    this.timerTimeout = setTimeout(() => this.stopAllSounds(), duration);
  }

  setAlarm(time: string) {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
    }
    const [hours, minutes] = time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    if (alarmTime <= new Date()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    this.alarmInterval = setInterval(() => {
      if (new Date() >= alarmTime) {
        this.alarmSound.play();
        clearInterval(this.alarmInterval);
      }
    }, 1000);
  }

  private updateActiveSounds() {
    const activeSounds: ActiveSound[] = [];
    for (const [id, sound] of this.sounds.entries()) {
      activeSounds.push({
        id,
        name: sound.name,
        path: sound.path,
        volume: sound.gain.gain.value
      });
    }
    this.activeSoundsSubject.next(activeSounds);
  }

  private playbackRateSubject = new BehaviorSubject<number>(1);
  public playbackRate$ = this.playbackRateSubject.asObservable();

  getSettings() {
    return {
      volume: this.masterVolumeSubject.value,
      pan: this.panSubject.value,
      bass: this.bassSubject.value,
      mid: this.midSubject.value,
      treble: this.trebleSubject.value,
      playbackRate: this.playbackRateSubject.value,
    };
  }

  getActiveSounds(): ActiveSound[] {
    return this.activeSoundsSubject.value;
  }

  playSoundFromPath(name: string, path: string) {
    this.loadSound(path).then(buffer => {
      this.playSound(name, path, buffer);
    });
  }

  reorderActiveSounds(previousIndex: number, currentIndex: number) {
    const activeSounds = this.getActiveSounds();
    moveItemInArray(activeSounds, previousIndex, currentIndex);
    this.activeSoundsSubject.next(activeSounds);
  }
}
