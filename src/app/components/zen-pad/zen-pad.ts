import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api';
import { AudioService, ActiveSound } from '../../services/audio';
import { VisualizerComponent } from '../visualizer/visualizer';
import { PresetManagerComponent } from '../preset-manager/preset-manager';

@Component({
  selector: 'app-zen-pad',
  standalone: true,
  imports: [
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatInputModule,
    MatSlideToggleModule,
    MatCardModule,
    CommonModule,
    VisualizerComponent,
    PresetManagerComponent,
    DragDropModule,
  ],
  templateUrl: './zen-pad.html',
  styleUrls: ['./zen-pad.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition('void <=> *', animate(300)),
    ]),
  ],
})
export class ZenPad implements OnInit {
  private audioService = inject(AudioService);
  private apiService = inject(ApiService);

  sounds = [
    { name: 'Heavy Rain', path: '/sounds/heavy-rain.mp3' },
    { name: 'Bells Tibetan Large', path: '/sounds/bells-tibetan.mp3' },
    { name: 'Large Waterfall', path: '/sounds/large_waterfall_1.mp3' },
  ];
  selectedSoundPath: string | undefined;
  timerValue: number | undefined;
  alarmTime: string | undefined;
  isDarkMode = false;
  isLooping = false;
  playbackRate = 1;
  backgrounds = [
    { name: 'Beach', path: '/assets/image/beach.jpg' },
    { name: 'Forest', path: '/assets/image/forest.jpg' },
    { name: 'Random', path: 'random' }
  ];
  selectedBackground = this.backgrounds[0].path;

  activeSounds$: Observable<ActiveSound[]>;
  masterVolume$: Observable<number>;
  pan$: Observable<number>;
  bass$: Observable<number>;
  mid$: Observable<number>;
  treble$: Observable<number>;

  constructor() {
    this.activeSounds$ = this.audioService.activeSounds$;
    this.masterVolume$ = this.audioService.masterVolume$;
    this.pan$ = this.audioService.pan$;
    this.bass$ = this.audioService.bass$;
    this.mid$ = this.audioService.mid$;
    this.treble$ = this.audioService.treble$;
  }

  ngOnInit() {
    this.loadSettings();
    this.changeBackground();
  }

  addSound() {
    if (this.selectedSoundPath) {
      const selectedSound = this.sounds.find(s => s.path === this.selectedSoundPath);
      if (selectedSound) {
        this.audioService.loadSound(this.selectedSoundPath).then((buffer) => {
          this.audioService.playSound(selectedSound.name, selectedSound.path, buffer);
        });
      }
    }
  }

  stopSound(id: string) {
    this.audioService.stopSound(id);
  }

  onSoundVolumeChange(id: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setVolume(id, Number(value));
  }

  onMasterVolumeChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setMasterVolume(Number(value));
  }

  onPanChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setPan(Number(value));
  }

  onEQChange(type: 'bass' | 'mid' | 'treble', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setEQ(type, Number(value));
  }

  onPlaybackRateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setPlaybackRate(Number(value));
  }

  changeBackground() {
    if (this.selectedBackground === 'random') {
      const backgroundUrl = this.apiService.getRandomBackgroundUrl();
      document.body.style.backgroundImage = `url(${backgroundUrl})`;
    } else {
      document.body.style.backgroundImage = `url(${this.selectedBackground})`;
    }
  }

  setTimer() {
    if (this.timerValue) {
      this.audioService.setTimer(this.timerValue);
    }
  }

  setAlarm() {
    if (this.alarmTime) {
      this.audioService.setAlarm(this.alarmTime);
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  toggleLoop() {
    this.isLooping = this.audioService.toggleLoop();
  }

  saveSettings() {
    const settings = {
      ...this.audioService.getSettings(),
      playbackRate: this.playbackRate,
    };
    localStorage.setItem('audioSettings', JSON.stringify(settings));
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
    if (settings) {
      this.audioService.setMasterVolume(settings.volume || 1);
      this.audioService.setPan(settings.pan || 0);
      this.audioService.setEQ('bass', settings.bass || 0);
      this.audioService.setEQ('mid', settings.mid || 0);
      this.audioService.setEQ('treble', settings.treble || 0);
      this.playbackRate = settings.playbackRate || 1;
      this.audioService.setPlaybackRate(this.playbackRate);
    }
  }

  randomizeSettings() {
    const volume = Math.random();
    const pan = Math.random() * 2 - 1;
    const bass = Math.random() * 20 - 10;
    const mid = Math.random() * 20 - 10;
    const treble = Math.random() * 20 - 10;
    this.playbackRate = Math.random() * 1.5 + 0.5;

    this.audioService.setMasterVolume(volume);
    this.audioService.setPan(pan);
    this.audioService.setEQ('bass', bass);
    this.audioService.setEQ('mid', mid);
    this.audioService.setEQ('treble', treble);
    this.audioService.setPlaybackRate(this.playbackRate);
  }

  randomizeSound() {
    this.apiService.getRamdomTracks().subscribe(response => {
      const randomTrack = response.results[Math.floor(Math.random() * response.results.length)];
      this.audioService.loadSound(randomTrack.audio).then(buffer => {
        this.audioService.playSound(randomTrack.name, randomTrack.audio, buffer);
      });
    });
  }

  stopAllSounds() {
    this.audioService.stopAllSounds();
  }

  drop(event: CdkDragDrop<string[]>) {
    this.audioService.reorderActiveSounds(event.previousIndex, event.currentIndex);
  }
}
