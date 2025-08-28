import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PresetManagerComponent } from './preset-manager';
import { PresetService } from '../../services/preset';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PresetManagerComponent', () => {
  let component: PresetManagerComponent;
  let fixture: ComponentFixture<PresetManagerComponent>;
  let presetService: PresetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresetManagerComponent, NoopAnimationsModule, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresetManagerComponent);
    component = fixture.componentInstance;
    presetService = TestBed.inject(PresetService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call presetService.savePreset when savePreset is called', () => {
    const savePresetSpy = spyOn(presetService, 'savePreset');
    component.newPresetName = 'My Test Preset';
    component.savePreset();
    expect(savePresetSpy).toHaveBeenCalledWith('My Test Preset');
  });

  it('should call presetService.loadPreset when loadPreset is called', () => {
    const loadPresetSpy = spyOn(presetService, 'loadPreset');
    component.loadPreset('123');
    expect(loadPresetSpy).toHaveBeenCalledWith('123');
  });

  it('should call presetService.deletePreset when deletePreset is called', () => {
    const deletePresetSpy = spyOn(presetService, 'deletePreset');
    component.deletePreset('123');
    expect(deletePresetSpy).toHaveBeenCalledWith('123');
  });
});
