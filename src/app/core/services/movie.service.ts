import { Injectable, inject } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);
  private baseUrl = environment.tmdb.baseUrl;
  private apiKey = environment.tmdb.apiKey;

  getPopular(page = 1): Observable<TmdbMovie[]> {
    const url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=fr-FR&page=${page}`;
    return this.http.get<any>(url).pipe(map(res => res.results || []));
  }

  getPosterUrl(path: string | null) {
    if (!path) return null;
    return `${environment.tmdb.posterUrl}${path}`;
  }

  getMovieDetails(id: string | number) {
    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=fr-FR`;
    return this.http.get<any>(url).pipe(map(res => res as TmdbMovie));
  }
}