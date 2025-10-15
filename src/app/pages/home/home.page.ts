import { Component, inject, OnInit, NgZone } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { MovieService, TmdbMovie } from 'src/app/core/services/movie.service';
import { UserService } from 'src/app/core/services/user.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { NgIf, NgForOf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [NgIf, NgForOf, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSpinner]
})
export class HomePage implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private movieService = inject(MovieService);
  private userService = inject(UserService);
  private zone = inject(NgZone);

  movies: TmdbMovie[] = [];
  isLoading = false;
  favorites = new Set<string>();
  private favSub?: Subscription;

  authReady = false;
  firestoreReady = false;
  tmdbReady = false;

  constructor() {}

  ngOnInit() {
    try { this.authReady = !!this.auth; } catch (e) { console.error('Auth error', e); }
    try { this.firestoreReady = !!this.firestore; } catch (e) { console.error('Firestore error', e); }
    this.tmdbReady = !!environment.tmdb.apiKey;

    this.loadMovies();
    this.loadFavoritesIfLogged();
  }

  async loadMovies() {
    this.isLoading = true;
    try {
      this.movies = await firstValueFrom(this.movieService.getPopular(1));
    } catch (e) {
      console.error('Error loading movies', e);
    } finally {
      this.isLoading = false;
    }
  }

  posterUrl(path: string | null) {
    return this.movieService.getPosterUrl(path);
  }

  async loadFavoritesIfLogged() {
    const user = this.auth.currentUser;
    if (!user) return;
    try {
      // subscribe to real-time favorites
      this.favSub?.unsubscribe();
      this.favSub = this.userService.favorites$(user.uid).subscribe((doc: { favoriteMovieIds?: string[] } | undefined) => {
        const favs = (doc && doc.favoriteMovieIds) ? doc.favoriteMovieIds : [];
        // ensure change-detection runs
        this.zone.run(() => {
          this.favorites = new Set((favs || []).map(String));
        });
      });
    } catch (e) {
      console.error('Error loading favorites', e);
    }
  }

  ngOnDestroy() {
    this.favSub?.unsubscribe();
  }

  isFavorite(movie: TmdbMovie) {
    return this.favorites.has(String(movie.id));
  }

  async toggleFavorite(movie: TmdbMovie) {
    const user = this.auth.currentUser;
    if (!user) {
      // optionally show a toast / navigate to login
      return;
    }
    try {
      const nowFav = await this.userService.toggleFavorite(user.uid, String(movie.id));
      if (nowFav) this.favorites.add(String(movie.id)); else this.favorites.delete(String(movie.id));
    } catch (e) {
      console.error('Toggle favorite error', e);
    }
  }
}
