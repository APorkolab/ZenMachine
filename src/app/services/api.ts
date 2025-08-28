import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
}

export interface JamendoResponse {
  results: JamendoTrack[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private clientId = 'c1c492b0'; // Replace with your actual client ID

  getRamdomTracks(): Observable<JamendoResponse> {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=10&fuzzytags=ambient,calm&speed=verylow&include=musicinfo&order=releasedate_desc&vocalinstrumental=instrumental&audioformat=mp32`;
    return this.http.get<JamendoResponse>(url);
  }

  getRandomBackgroundUrl(): string {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomId}/${width}/${height}`;
  }
}
