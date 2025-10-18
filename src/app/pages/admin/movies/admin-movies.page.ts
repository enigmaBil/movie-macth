import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-admin-movies',
  templateUrl: './admin-movies.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AdminMoviesPage {
  newMovie: Partial<Movie> = { title: '', overview: '', releaseDate: '', posterPath: '' };
  private firestore = inject(Firestore);
  private toastCtrl = inject(ToastController);

  constructor() {}

  async addMovie() {
    try {
      const moviesRef = collection(this.firestore, 'movies');
      const movieData = { ...this.newMovie, customAdded: true, voteAverage: 0, voteCount: 0, createdAt: new Date() };
      const res = await addDoc(moviesRef, movieData);
      const toast = await this.toastCtrl.create({ message: 'Film ajouté', duration: 2000, color: 'success' });
      await toast.present();
      this.newMovie = { title: '', overview: '', releaseDate: '', posterPath: '' };
    } catch (e) {
      console.error('Add movie error', e);
      const toast = await this.toastCtrl.create({ message: 'Erreur ajout film', duration: 2000, color: 'danger' });
      await toast.present();
    }
  }
}
