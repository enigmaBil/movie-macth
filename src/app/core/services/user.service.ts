import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, authState, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { doc, Firestore, setDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { docData } from '@angular/fire/firestore';
import { RegisterData } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  user$: Observable<User | null> = authState(this.auth);

  async register(data: RegisterData) {
    const cred = await createUserWithEmailAndPassword(this.auth, data.email, data.password);

    await updateProfile(cred.user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    const userDoc = doc(this.firestore, 'users', cred.user.uid);

    const payload: any = {
      id: cred.user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      email: data.email,
      role: 'user',
      isActive: true,
      favoriteMovieIds: [],
      photoDataUrl: null,
      createdAt: new Date()
    };

    if (data.photoDataUrl) {
      // Store the base64/data URL in Firestore and set the auth photoURL to the same data URL
      payload.photoDataUrl = data.photoDataUrl;
      payload.photoURL = data.photoDataUrl;
      try {
        await updateProfile(cred.user, { photoURL: data.photoDataUrl });
      } catch (e) {
        console.warn('Could not set auth photoURL during registration', e);
      }
    }

    await setDoc(userDoc, payload);

    return cred.user;
  }

  // Real-time observable for user document (includes favorites)
  favorites$(uid: string) {
    const userRef = doc(this.firestore, 'users', uid);
    return runInInjectionContext(this.injector, () => docData(userRef)) as any;
  }

  // Toggle a movie id in the user's favoriteMovieIds array
  async toggleFavorite(uid: string, movieId: string) {
    const userRef = doc(this.firestore, 'users', uid);
    const snap = await runInInjectionContext(this.injector, () => getDoc(userRef as any));
    if (!snap.exists()) {
      // create doc with favoriteMovieIds
      await setDoc(userRef, { favoriteMovieIds: [movieId] }, { merge: true });
      return true;
    }
    const data: any = snap.data();
    const favs: string[] = data.favoriteMovieIds || [];
    const has = favs.includes(movieId);
    const newFavs = has ? favs.filter(id => id !== movieId) : [...favs, movieId];
    await runInInjectionContext(this.injector, () => updateDoc(userRef as any, { favoriteMovieIds: newFavs }));
    return !has;
  }

  async getUserFavorites(uid: string) {
    const userRef = doc(this.firestore, 'users', uid);
    const snap = await runInInjectionContext(this.injector, () => getDoc(userRef as any));
    if (!snap.exists()) return [] as string[];
    const data: any = snap.data();
    return data.favoriteMovieIds || [];
  }

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async logout() {
    return signOut(this.auth);
  }
}