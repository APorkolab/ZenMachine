import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ZenPad } from './zen-pad';
import { AudioService } from '../../services/audio';
import { ApiService } from '../../services/api';
import { PresetService } from '../../services/preset';

describe('ZenPad', () => {
  let component: ZenPad;
  let fixture: ComponentFixture<ZenPad>;
  let audioService: AudioService;
  let apiService: ApiService;
  let presetService: PresetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZenPad, NoopAnimationsModule, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZenPad);
    component = fixture.componentInstance;
    audioService = TestBed.inject(AudioService);
    apiService = TestBed.inject(ApiService);
    presetService = TestBed.inject(PresetService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call audioService.loadSound and audioService.playSound when addSound is called', async () => {
    const loadSoundSpy = spyOn(audioService, 'loadSound').and.returnValue(Promise.resolve({} as AudioBuffer));
    const playSoundSpy = spyOn(audioService, 'playSound');

    component.selectedSoundPath = '/sounds/heavy-rain.mp3';
    await component.addSound();

    expect(loadSoundSpy).toHaveBeenCalledWith('/sounds/heavy-rain.mp3');
    expect(playSoundSpy).toHaveBeenCalled();
  });


  it('should set the background image when changeBackground is called with a path', () => {
    component.selectedBackground = '/assets/image/beach.jpg';
    component.changeBackground();
    expect(document.body.style.backgroundImage).toBe('url("/assets/image/beach.jpg")');
  });
});
