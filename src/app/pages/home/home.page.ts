import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonApp } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonApp, IonHeader, IonToolbar, IonTitle, IonContent, IonApp],
})
export class HomePage {
  authReady = false;
  firestoreReady = false;
  tmdbReady = false;

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  ngOnInit() {
     // Test Auth
    try {
      this.authReady = !!this.auth;
    } catch (e) {
      console.error('Auth error', e);
    }

    // Test Firestore
    try {
      this.firestoreReady = !!this.firestore;
    } catch (e) {
      console.error('Firestore error', e);
    }

    // Test TMDb
    this.tmdbReady = !!environment.tmdb.apiKey;
  
  }

  constructor() {}
   
}
