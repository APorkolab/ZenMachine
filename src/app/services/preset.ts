import { Injectable, inject } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class PresetService {
  private audioService = inject(AudioService);
  private presetsSubject = new BehaviorSubject<Preset[]>([]);
  public presets$ = this.presetsSubject.asObservable();

  constructor() {
    this.loadPresetsFromStorage();
  }

  private loadPresetsFromStorage() {
    const presets = JSON.parse(localStorage.getItem('presets') || '[]');
    this.presetsSubject.next(presets);
  }

  private savePresetsToStorage() {
    localStorage.setItem('presets', JSON.stringify(this.presetsSubject.value));
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
    const updatedPresets = [...this.presetsSubject.value, newPreset];
    this.presetsSubject.next(updatedPresets);
    this.savePresetsToStorage();
  }

  deletePreset(id: string) {
    const updatedPresets = this.presetsSubject.value.filter(p => p.id !== id);
    this.presetsSubject.next(updatedPresets);
    this.savePresetsToStorage();
  }

  loadPreset(id: string) {
    const preset = this.presetsSubject.value.find(p => p.id === id);
    if (preset) {
      this.audioService.stopAllSounds();
      this.audioService.setMasterVolume(preset.masterVolume);
      this.audioService.setPan(preset.pan);
      this.audioService.setEQ('bass', preset.bass);
      this.audioService.setEQ('mid', preset.mid);
      this.audioService.setEQ('treble', preset.treble);
      this.audioService.setPlaybackRate(preset.playbackRate);

      preset.activeSounds.forEach(sound => {
        this.audioService.playSoundFromPath(sound.name, sound.path);
      });
    }
  }
}
