import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { MovieService, TmdbMovie } from 'src/app/core/services/movie.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.page.html',
  styleUrls: ['./movie-details.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle]
})
export class MovieDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);

  movie: any = null;
  isLoading = true;

  constructor() {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/home']);
      return;
    }
    try {
      this.movie = await firstValueFrom(this.movieService.getMovieDetails(id));
    } catch (e) {
      console.error('Error fetching movie details', e);
    } finally {
      this.isLoading = false;
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  posterUrl(path: string | null) {
    return this.movieService.getPosterUrl(path) || '/assets/icon/favicon.png';
  }
}
