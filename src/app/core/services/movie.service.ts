import { Injectable, inject, Injector, runInInjectionContext } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, of, from } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Firestore realtime
import { Firestore, collection, collectionData, query, where, orderBy, doc, getDoc } from '@angular/fire/firestore';

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
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  getPopular(page = 1): Observable<TmdbMovie[]> {
    const url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=fr-FR&page=${page}`;
    return this.http.get<any>(url).pipe(map(res => res.results || []));
  }

  getPosterUrl(path: string | null) {
    if (!path) return null;

    // If admin stored a full URL (http:// or https://) or a data URL (base64), return as-is
    const lower = path.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
      return path;
    }

    // If it's a gs:// storage path, return as-is (or you can convert to an http URL via storage SDK)
    if (lower.startsWith('gs://')) return path;

    // Otherwise assume it's a TMDB poster path fragment, ensure it has a leading '/'
    const frag = path.startsWith('/') ? path : `/${path}`;
    return `${environment.tmdb.posterUrl}${frag}`;
  }

  getMovieDetails(id: string | number) {
    // Try Firestore first for admin-added custom movies (their ids are strings/doc ids).
    if (typeof id === 'string' && !/^[0-9]+$/.test(id)) {
      // run Firestore getDoc inside injection context
      return from(runInInjectionContext(this.injector, async () => {
        const movieDocRef = doc(this.firestore, 'movies', id);
        const snap = await getDoc(movieDocRef as any);
        return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null;
      })).pipe(
        switchMap(res => {
          if (res) {
            // Normalize fields to TMDB-like shape
            const c: any = res;
            const normalized = {
              id: c.id,
              title: c.title || c.name || '',
              overview: c.overview || c.description || '',
              poster_path: c.posterPath || c.poster_path || null,
              release_date: c.releaseDate || c.release_date || null,
              customAdded: true,
              // keep original payload for admin-only fields
              _raw: c
            };
            return of(normalized as TmdbMovie);
          }
          // fallback to TMDB HTTP lookup by numeric id
          const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=fr-FR`;
          return this.http.get<any>(url).pipe(map(res => res as TmdbMovie), catchError(err => {
            console.error('TMDB fetch error for details:', err);
            return of(null as any);
          }));
        })
      );
    }

    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=fr-FR`;
    return this.http.get<any>(url).pipe(map(res => res as TmdbMovie));
  }

  /**
   * Stream custom movies from Firestore in real-time.
   * Custom movies are documents in `movies` collection with `customAdded: true`.
   */
  customMovies$(): Observable<any[]> {
    // collectionData must be called inside Angular's injection context when using AngularFire
    return runInInjectionContext(this.injector, () => {
      const moviesRef = collection(this.firestore, 'movies');
      const q = query(moviesRef, where('customAdded', '==', true), orderBy('createdAt', 'desc')) as any;
      return (collectionData(q, { idField: 'id' }) as Observable<any[]>)
        .pipe(catchError(err => {
          console.error('Error streaming custom movies:', err);
          return of([]);
        }));
    });
  }

  /**
   * Combined stream: TMDB popular results (one-shot per page) combined with realtime custom movies.
   * Custom movies are placed before TMDB results.
   */
  moviesStream(page = 1): Observable<any[]> {
    const tmdb$ = this.getPopular(page).pipe(catchError(err => {
      console.error('TMDB fetch error:', err);
      return of([] as any[]);
    }), tap(res => console.debug('TMDB results count', (res || []).length)));
    const custom$ = this.customMovies$().pipe(tap(res => console.debug('custom movies count', (res || []).length)));

    return combineLatest([custom$, tmdb$]).pipe(
      map(([custom, tmdb]) => {
        // Normalize custom movies shape to match TmdbMovie-ish shape when possible
        const normalizedCustom = (custom || []).map(c => ({
          id: c.id || `custom-${c._id || Math.random()}`,
          title: c.title || c.name || '',
          overview: c.overview || c.description || '',
          poster_path: c.posterPath || c.poster_path || null,
          release_date: c.releaseDate || c.release_date || null,
          customAdded: true,
        }));

        // Return custom first, then TMDB results (avoid duplicates by id)
        const ids = new Set(normalizedCustom.map(m => String(m.id)));
        const filteredTmdb = (tmdb || []).filter((m: any) => !ids.has(String(m.id)));
        return [...normalizedCustom, ...filteredTmdb];
      })
    );
  }
}