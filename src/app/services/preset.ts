import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActiveSound, AudioService } from './audio';

export interface Preset {
  id: string;
  name: string;
  activeSounds: ActiveSound[];
  masterVolume: number;
  pan: number;
  bass: number;
  mid: number;
  treble: number;
  playbackRate: number;
}

@Injectable({ providedIn: 'root' })
export class PresetService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private audioService = inject(AudioService);

  private presetsSubject = new BehaviorSubject<Preset[]>([]);
  public readonly presets$ = this.presetsSubject.asObservable();

  constructor() {
    this.loadPresetsFromStorage();
  }

  private loadPresetsFromStorage() {
    if (!this.isBrowser) {
      this.presetsSubject.next([]);
      return;
    }
    try {
      const raw = localStorage.getItem('presets');
      const presets: Preset[] = raw ? JSON.parse(raw) : [];
      this.presetsSubject.next(presets);
    } catch {
      this.presetsSubject.next([]);
    }
  }

  private savePresetsToStorage() {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('presets', JSON.stringify(this.presetsSubject.value));
    } catch {
      /* ignore quota / JSON errors */
    }
  }

  getPresets(): Preset[] {
    return this.presetsSubject.value;
  }

  savePreset(name: string) {
    const settings = this.audioService.getSettings();
    const newPreset: Preset = {
      id: new Date().toISOString(),
      name,
      activeSounds: this.audioService.getActiveSounds(),
      masterVolume: settings.volume,
      pan: settings.pan,
      bass: settings.bass,
      mid: settings.mid,
      treble: settings.treble,
      playbackRate: settings.playbackRate,
    };
    const updated = [...this.presetsSubject.value, newPreset];
    this.presetsSubject.next(updated);
    this.savePresetsToStorage();
  }

  deletePreset(id: string) {
    const updated = this.presetsSubject.value.filter((p) => p.id !== id);
    this.presetsSubject.next(updated);
    this.savePresetsToStorage();
  }

  loadPreset(id: string) {
    const preset = this.presetsSubject.value.find((p) => p.id === id);
    if (!preset) return;

    this.audioService.stopAllSounds();
    this.audioService.setMasterVolume(preset.masterVolume);
    this.audioService.setPan(preset.pan);
    this.audioService.setEQ('bass', preset.bass);
    this.audioService.setEQ('mid', preset.mid);
    this.audioService.setEQ('treble', preset.treble);
    this.audioService.setPlaybackRate(preset.playbackRate);

    preset.activeSounds.forEach((s) => {
      this.audioService.playSoundFromPath(s.name, s.path);
    });
  }
}
