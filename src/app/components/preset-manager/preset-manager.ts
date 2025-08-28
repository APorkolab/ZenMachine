import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Preset, PresetService } from '../../services/preset';

@Component({
  selector: 'app-preset-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './preset-manager.html',
  styleUrls: ['./preset-manager.scss']
})
export class PresetManagerComponent {
  private presetService = inject(PresetService);
  public presets$: Observable<Preset[]>;
  public newPresetName = '';

  constructor() {
    this.presets$ = this.presetService.presets$;
  }

  savePreset() {
    if (this.newPresetName) {
      this.presetService.savePreset(this.newPresetName);
      this.newPresetName = '';
    }
  }

  loadPreset(id: string) {
    this.presetService.loadPreset(id);
  }

  deletePreset(id: string) {
    this.presetService.deletePreset(id);
  }
}
