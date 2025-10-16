import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { UserService } from 'src/app/core/services/user.service';
import { MovieService, TmdbMovie } from 'src/app/core/services/movie.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, CommonModule]
})
export class FavoritesPage implements OnInit {
  private auth = inject(Auth);
  private userService = inject(UserService);
  private movieService = inject(MovieService);
  private zone = inject(NgZone);

  movies: TmdbMovie[] = [];
  isLoading = true;
  private favSub?: Subscription;

  constructor() {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;
    try {
      // Subscribe to real-time favorite list
      this.favSub?.unsubscribe();
      this.favSub = this.userService.favorites$(user.uid).subscribe(async (doc: { favoriteMovieIds?: string[] } | undefined) => {
        this.isLoading = true;
        const favs: string[] = (doc && doc.favoriteMovieIds) ? doc.favoriteMovieIds : [];
        // fetch movie details in parallel using firstValueFrom
        const promises = (favs || []).map(id =>
          firstValueFrom(this.movieService.getMovieDetails(id)).catch(e => { console.warn('Failed fetch', id, e); return null; })
        );
        const results = await Promise.all(promises);
        const movies: TmdbMovie[] = (results || []).filter(Boolean) as TmdbMovie[];
        // update UI inside zone
        this.zone.run(() => {
          this.movies = movies;
          this.isLoading = false;
        });
      });
    } catch (e) {
      console.error('Error loading favorites', e);
    } finally {
      // handled in subscription
    }
  }

  async removeFavorite(movieId: string | number) {
    const user = this.auth.currentUser;
    if (!user) return;
    await this.userService.toggleFavorite(user.uid, String(movieId));
  }

  ngOnDestroy() {
    this.favSub?.unsubscribe();
  }
}
