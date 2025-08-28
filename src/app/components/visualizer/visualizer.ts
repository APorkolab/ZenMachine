import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  templateUrl: './visualizer.html',
  styleUrls: ['./visualizer.scss']
})
export class VisualizerComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private audioService = inject(AudioService);
  private canvasContext!: CanvasRenderingContext2D;

  ngAfterViewInit() {
    this.canvasContext = this.canvasRef.nativeElement.getContext('2d')!;
    this.draw();
  }

  draw() {
    requestAnimationFrame(() => this.draw());

    const analyser = this.audioService.getAnalyser();
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas;
    this.canvasContext.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      this.canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      this.canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
  }
}
