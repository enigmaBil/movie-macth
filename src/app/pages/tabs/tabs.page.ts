import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MovieService } from 'src/app/core/services/movie.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonButtons, IonTitle, IonMenuButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonTitle, IonButtons, IonToolbar, IonHeader, IonLabel, IonIcon, IonTabButton, IonTabBar, IonTabs, CommonModule, FormsModule, IonMenuButton]
})
export class TabsPage implements OnInit, OnDestroy {
  pageTitle = 'Movie Match';
  private routerSub?: Subscription;
  private movieSub?: Subscription;

  constructor(private router: Router, private movieService: MovieService) { }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects || e.url || '';

      // If we're on a movie details route, fetch the movie title dynamically
      if (url.includes('/tabs/movie') || url.includes('/movie/')) {
        const parts = url.split('/');
        const last = parts[parts.length - 1] || '';
        const id = last.split('?')[0] || '';
        if (id) {
          // unsubscribe previous movieSub
          this.movieSub?.unsubscribe();
          this.movieSub = this.movieService.getMovieDetails(id).pipe(take(1)).subscribe(m => {
            if (m && (m as any).title) {
              this.pageTitle = (m as any).title;
            } else {
              this.pageTitle = 'Détails du film';
            }
          }, err => {
            console.error('Failed to load movie details for title', err);
            this.pageTitle = 'Détails du film';
          });
          return;
        }
      }

      this.pageTitle = this.titleForUrl(url);
    });
  }

  private titleForUrl(url: string) {
    if (!url) return 'Movie Match';
    if (url.includes('/tabs/home') || url === '/home' || url === '/tabs') return 'Accueil';
    if (url.includes('/tabs/favorites') || url === '/favorites') return 'Favoris';
    if (url.includes('/tabs/profile') || url === '/profile') return 'Profil';
    // movie handled dynamically above
    if (url.includes('/tabs/admin/users') || url.includes('/admin/users')) return 'Gestion utilisateurs';
    if (url.includes('/tabs/admin/movies') || url.includes('/admin/movies')) return 'Gestion films';
    if (url.includes('/matching')) return 'Matching';
    if (url.includes('/play-list')) return 'Playlist';
    return 'Movie Match';
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.movieSub?.unsubscribe();
  }

}
