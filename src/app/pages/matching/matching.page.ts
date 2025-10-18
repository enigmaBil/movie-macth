import { Component, inject, OnInit, OnDestroy, Injector, runInInjectionContext, NgZone } from '@angular/core'; // <-- Ajout de NgZone
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
  private zone = inject(NgZone); // <-- Injection de NgZone
  movieService = inject(MovieService);

  userId: string | null = null;
  matches: UserMatch[] = [];
  isLoading = true;
  private sub?: Subscription;
  private movieCache = new Map<string, TmdbMovie | null>();
  movieDetailsMap: Record<string, TmdbMovie | null> = {};

  getPosterForId(mid: string) {
    const md = this.movieDetailsMap[mid];
    if (!md) return '/assets/icon/favicon.png';
    const poster = (md as any).poster_path || (md as any).posterPath || null;
    return this.movieService.getPosterUrl(poster) || '/assets/icon/favicon.png';
  }

  ngOnInit(): void {
    console.log('[MatchingPage] ngOnInit démarré');

    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        console.log('[MatchingPage] onAuthStateChanged', user?.uid || 'null');

        if (!user) {
          console.log('[MatchingPage] Utilisateur non connecté');
          this.zone.run(() => { // <-- Zone.run
            this.userId = null;
            this.matches = [];
            this.isLoading = false;
          });
          return;
        }

        this.zone.run(() => { // <-- Zone.run
          this.userId = user.uid;
          console.log('[MatchingPage] userId défini:', this.userId);
        });

        this.sub?.unsubscribe();
        this.zone.run(() => { this.isLoading = true; }); // <-- Zone.run

        this.sub = this.matchingService.matchesForUser(user.uid).subscribe(async (list) => {
          console.log('[MatchingPage] Matches reçus:', list);

          // Chargement des détails des films
          const ids = Array.from(new Set(list.reduce((acc: string[], m) => acc.concat(m.commonMovieIds || []), [] as string[])));
          const toFetch = ids.filter(id => !this.movieCache.has(id));

          await Promise.all(toFetch.map(async id => {
            try {
              const mv = await firstValueFrom(this.movieService.getMovieDetails(id));
              this.movieCache.set(id, mv as any || null);
              this.movieDetailsMap[id] = mv as any || null;
            } catch (err) {
              console.warn('Erreur chargement détail film', id, err);
              this.movieCache.set(id, null);
              this.movieDetailsMap[id] = null;
            }
          }));

          ids.forEach(id => {
            if (!this.movieDetailsMap[id]) this.movieDetailsMap[id] = this.movieCache.get(id) || null;
          });

          // Mettre à jour les propriétés dans la zone Angular
          this.zone.run(() => { // <-- Zone.run
            this.matches = list;
            this.isLoading = false;
          });
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}