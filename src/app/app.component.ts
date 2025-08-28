import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZenPad } from './components/zen-pad/zen-pad';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ZenPad, Footer],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
