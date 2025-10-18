import { Component, inject, OnInit, OnDestroy, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { MatchingService, UserMatch } from 'src/app/core/services/matching.service';
import { MovieService, TmdbMovie } from 'src/app/core/services/movie.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matching',
  templateUrl: './matching.page.html',
  styleUrls: ['./matching.page.scss'],
  standalone: true,
  imports: [IonContent, IonList, IonItem, IonLabel, CommonModule, RouterLink]
})
export class MatchingPage implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private injector = inject(Injector);
  private matchingService = inject(MatchingService);
  movieService = inject(MovieService);

  userId: string | null = null;
  matches: UserMatch[] = [];
  private sub?: Subscription;
  // cache movie details by id
  private movieCache = new Map<string, TmdbMovie | null>();
  // map of movie id -> TmdbMovie for template rendering
  movieDetailsMap: Record<string, TmdbMovie | null> = {};

  getPosterForId(mid: string) {
    const md = this.movieDetailsMap[mid];
    if (!md) return '/assets/icon/favicon.png';
    const poster = (md as any).poster_path || (md as any).posterPath || null;
    return this.movieService.getPosterUrl(poster) || '/assets/icon/favicon.png';
  }

  ngOnInit(): void {
    // Listen to auth state reactively to ensure we have the user when available
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (u) => {
        if (!u) {
          // not logged in
          this.userId = null;
          this.sub?.unsubscribe();
          this.sub = undefined;
          this.matches = [];
          return;
        }
        this.userId = u.uid;
        // subscribe to matches for this user
        this.sub?.unsubscribe();
        this.sub = this.matchingService.matchesForUser(u.uid).subscribe(async list => {
      this.matches = list;
      // collect unique movie ids
  const ids = Array.from(new Set(list.reduce((acc: string[], m) => acc.concat(m.commonMovieIds || []), [] as string[])));
      // fetch details for ids not in cache
      const toFetch = ids.filter(id => !this.movieCache.has(id));
      await Promise.all(toFetch.map(async id => {
        try {
          const mv = await firstValueFrom(this.movieService.getMovieDetails(id));
          this.movieCache.set(id, mv as any || null);
          this.movieDetailsMap[id] = mv as any || null;
        } catch (err) {
          console.warn('Failed to load movie details for id', id, err);
          this.movieCache.set(id, null);
          this.movieDetailsMap[id] = null;
        }
      }));
      // ensure existing ids are in map
      ids.forEach(id => {
        if (!this.movieDetailsMap[id]) this.movieDetailsMap[id] = this.movieCache.get(id) || null;
      });
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
