import { moveItemInArray } from '@angular/cdk/drag-drop';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveSound {
  id: string;
  name: string;
  path: string;
  volume: number;
}

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private ctx?: AudioContext;
  private masterGainNode?: GainNode;
  private bassEQ?: BiquadFilterNode;
  private midEQ?: BiquadFilterNode;
  private trebleEQ?: BiquadFilterNode;
  private panner?: StereoPannerNode;
  private analyser?: AnalyserNode;

  private alarmAudio?: HTMLAudioElement;

  private sounds = new Map<
    string,
    { source: AudioBufferSourceNode; gain: GainNode; name: string; path: string }
  >();

  private timerTimeout: any;
  private alarmInterval: any;
  private isLooping = false;
  private soundCounter = 0;

  private activeSoundsSubject = new BehaviorSubject<ActiveSound[]>([]);
  public readonly activeSounds$ = this.activeSoundsSubject.asObservable();

  private masterVolumeSubject = new BehaviorSubject<number>(1);
  public readonly masterVolume$ = this.masterVolumeSubject.asObservable();

  private panSubject = new BehaviorSubject<number>(0);
  public readonly pan$ = this.panSubject.asObservable();

  private bassSubject = new BehaviorSubject<number>(0);
  public readonly bass$ = this.bassSubject.asObservable();

  private midSubject = new BehaviorSubject<number>(0);
  public readonly mid$ = this.midSubject.asObservable();

  private trebleSubject = new BehaviorSubject<number>(0);
  public readonly treble$ = this.trebleSubject.asObservable();

  private playbackRateSubject = new BehaviorSubject<number>(1);
  public readonly playbackRate$ = this.playbackRateSubject.asObservable();

  /** Böngészőben hozza létre a Web Audio graphot. Hívd user-gesztusban. */
  init(): void {
    if (!this.isBrowser || this.ctx) return;

    const g = globalThis as any;
    const AC: typeof AudioContext | undefined = g.AudioContext || g.webkitAudioContext;
    if (!AC) return;

    this.ctx = new AC();

    this.masterGainNode = this.ctx.createGain();
    this.bassEQ = new BiquadFilterNode(this.ctx, { type: 'lowshelf', frequency: 150, gain: 0 });
    this.midEQ = new BiquadFilterNode(this.ctx, { type: 'peaking', frequency: 1000, gain: 0 });
    this.trebleEQ = new BiquadFilterNode(this.ctx, { type: 'highshelf', frequency: 3000, gain: 0 });
    this.panner = new StereoPannerNode(this.ctx, { pan: 0 });
    this.analyser = this.ctx.createAnalyser();

    this.masterGainNode
      .connect(this.bassEQ)
      .connect(this.midEQ)
      .connect(this.trebleEQ)
      .connect(this.panner)
      .connect(this.analyser)
      .connect(this.ctx.destination);

    this.masterGainNode.gain.value = this.masterVolumeSubject.value;
    this.panner.pan.value = this.panSubject.value;
    this.bassEQ.gain.value = this.bassSubject.value;
    this.midEQ.gain.value = this.midSubject.value;
    this.trebleEQ.gain.value = this.trebleSubject.value;

    // helyes assets útvonal (nincs leading "/")
    this.alarmAudio = new Audio('assets/mp3/alarm.mp3');
    this.alarmAudio.load();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** User-gesztusban hívd, ha “autoplay blocked” üzenet jön. */
  unlock(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Visszaadja az AnalyserNode-ot (vizualizációhoz). */
  public getAnalyser(): AnalyserNode {
    const ctx = this.ensureCtx();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      if (this.panner) {
        this.panner.disconnect();
        this.panner.connect(this.analyser).connect(ctx.destination);
      }
    }
    return this.analyser;
  }

  async loadSound(url: string): Promise<AudioBuffer> {
    const ctx = this.ensureCtx();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load sound: ${url}`);
    const arr = await res.arrayBuffer();
    return await ctx.decodeAudioData(arr);
  }

  playSound(name: string, path: string, buffer: AudioBuffer) {
    const ctx = this.ensureCtx();

    const id = `${path}-${this.soundCounter++}`;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = this.isLooping;
    source.playbackRate.value = this.playbackRateSubject.value;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;

    source.connect(gainNode).connect(this.masterGainNode!);
    source.start();

    this.sounds.set(id, { source, gain: gainNode, name, path });
    this.updateActiveSounds();
  }

  playSoundFromPath(name: string, path: string) {
    this.loadSound(path).then((buffer) => this.playSound(name, path, buffer));
  }

  stopSound(id: string) {
    const sound = this.sounds.get(id);
    if (sound) {
      try {
        sound.source.stop();
      } catch {}
      try {
        sound.source.disconnect();
      } catch {}
      this.sounds.delete(id);
      this.updateActiveSounds();
    }
  }

  stopAllSounds() {
    for (const id of Array.from(this.sounds.keys())) {
      this.stopSound(id);
    }
  }

  setVolume(id: string, volume: number) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.gain.gain.value = volume;
      this.updateActiveSounds();
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolumeSubject.next(volume);
    if (!this.isBrowser) return;
    this.ensureCtx();
    if (this.masterGainNode) this.masterGainNode.gain.value = volume;
  }

  setPan(pan: number) {
    this.panSubject.next(pan);
    if (!this.isBrowser) return;
    this.ensureCtx();
    if (this.panner) this.panner.pan.value = pan;
  }

  setEQ(type: 'bass' | 'mid' | 'treble', value: number) {
    switch (type) {
      case 'bass':
        this.bassSubject.next(value);
        if (this.isBrowser) {
          this.ensureCtx();
          if (this.bassEQ) this.bassEQ.gain.value = value;
        }
        break;
      case 'mid':
        this.midSubject.next(value);
        if (this.isBrowser) {
          this.ensureCtx();
          if (this.midEQ) this.midEQ.gain.value = value;
        }
        break;
      case 'treble':
        this.trebleSubject.next(value);
        if (this.isBrowser) {
          this.ensureCtx();
          if (this.trebleEQ) this.trebleEQ.gain.value = value;
        }
        break;
    }
  }

  setPlaybackRate(rate: number) {
    this.playbackRateSubject.next(rate);
    if (!this.isBrowser) return;
    this.ensureCtx();
    for (const s of this.sounds.values()) {
      s.source.playbackRate.value = rate;
    }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    if (!this.isBrowser) return this.isLooping;
    for (const s of this.sounds.values()) {
      s.source.loop = this.isLooping;
    }
    return this.isLooping;
  }

  setTimer(minutes: number) {
    if (this.timerTimeout) clearTimeout(this.timerTimeout);
    const duration = minutes * 60 * 1000;
    this.timerTimeout = setTimeout(() => this.stopAllSounds(), duration);
  }

  setAlarm(time: string) {
    if (!this.isBrowser) return;
    if (this.alarmInterval) clearInterval(this.alarmInterval);

    const [hh, mm] = time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hh, mm, 0, 0);
    if (alarmTime <= new Date()) alarmTime.setDate(alarmTime.getDate() + 1);

    this.alarmInterval = setInterval(() => {
      if (new Date() >= alarmTime) {
        this.alarmAudio?.play().catch(() => {});
        clearInterval(this.alarmInterval);
      }
    }, 1000);
  }

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

  reorderActiveSounds(previousIndex: number, currentIndex: number) {
    const active = [...this.activeSoundsSubject.value];
    moveItemInArray(active, previousIndex, currentIndex);
    this.activeSoundsSubject.next(active);
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.init();
    if (!this.ctx) throw new Error('Web Audio API not available (SSR/unsupported)');
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private updateActiveSounds() {
    const list: ActiveSound[] = [];
    for (const [id, s] of this.sounds.entries()) {
      list.push({ id, name: s.name, path: s.path, volume: s.gain.gain.value });
    }
    this.activeSoundsSubject.next(list);
  }
}
