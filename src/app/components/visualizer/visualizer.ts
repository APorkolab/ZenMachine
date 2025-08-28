import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  templateUrl: './visualizer.html',
  styleUrls: ['./visualizer.scss'],
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private audio = inject(AudioService);

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) return;

    this.resizeCanvasForDpr();
    this.loop();
    // opcionális: ablakméret változásra újraméretezés
    window.addEventListener('resize', this.resizeCanvasForDpr, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    if (this.isBrowser) {
      window.removeEventListener('resize', this.resizeCanvasForDpr);
    }
  }

  // --- Private ---

  private resizeCanvasForDpr = () => {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 120;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // skálázás vissza CSS px-re
  };

  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop);
    if (!this.ctx) return;

    let analyser: AnalyserNode | null = null;
    try {
      analyser = this.audio.getAnalyser();
    } catch {
      // AudioContext még nincs feloldva; tisztíts és várj a következő frame-re
      this.clear();
      return;
    }
    if (!analyser) {
      this.clear();
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    if (bufferLength === 0) {
      this.clear();
      return;
    }

    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);

    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    const barW = (width / bufferLength) * 0.6; // sűrűbb csíkok
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = data[i];
      const barH = (v / 255) * height;
      // egyszerű fill; nincs fix szín-előírás
      ctx.fillRect(x, height - barH, barW, barH);
      x += barW + 1;
      if (x > width) break;
    }
  };

  private clear() {
    if (!this.ctx) return;
    const c = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
  }
}
