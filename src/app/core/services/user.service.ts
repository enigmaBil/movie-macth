import { Injectable, NgZone, inject, Injector, runInInjectionContext } from "@angular/core";
import { Auth, signInWithEmailAndPassword, signOut, authState, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import type { User } from 'firebase/auth';
import { Observable } from 'rxjs';
import { doc, Firestore, setDoc, docData } from "@angular/fire/firestore";
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { RegisterData } from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private injector = inject(Injector);
  private zone = inject(NgZone);

  user$!: Observable<User | null>;

  constructor() {
    this.user$ = authState(this.auth);
  }

  async login(email: string, password: string) {
    return this.zone.runOutsideAngular(async () => {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      return cred.user;
    });
  }

  async register(data: RegisterData) {
    return this.zone.runOutsideAngular(async () => {
      const cred = await createUserWithEmailAndPassword(this.auth, data.email, data.password);

      await updateProfile(cred.user, {
        displayName: `${data.firstName} ${data.lastName}`,
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
        photoBase64: null,
        createdAt: new Date(),
      };

      if (data.photoDataUrl) {
        try {
          const downloadUrl = await this.uploadProfilePhoto(cred.user.uid, data.photoDataUrl);
          payload.photoBase64 = data.photoDataUrl;
          payload.photoURL = downloadUrl;
          await updateProfile(cred.user, { photoURL: downloadUrl });
        } catch (e) {
          console.warn('Photo upload failed', e);
        }
      }

      await setDoc(userDoc, payload);
      console.log('User document created in Firestore with payload:', payload);
      return cred.user;
    });
  }

  async logout() {
    return this.zone.runOutsideAngular(() => signOut(this.auth));
  }

  async toggleFavorite(uid: string, movieId: string) {
    return this.zone.runOutsideAngular(async () => {
      const userRef = doc(this.firestore, 'users', uid);
      const snapshot = await getDoc(userRef as any);
      if (!snapshot.exists()) {
        await setDoc(userRef, { favoriteMovieIds: [movieId] }, { merge: true } as any);
        return true;
      }

      const data: any = snapshot.data();
      const current: string[] = data.favoriteMovieIds || [];
      const isFav = current.includes(movieId);

      if (isFav) {
        await updateDoc(userRef as any, { favoriteMovieIds: arrayRemove(movieId) });
        return false;
      } else {
        await updateDoc(userRef as any, { favoriteMovieIds: arrayUnion(movieId) });
        return true;
      }
    });
  }

  async getUserFavorites(uid: string) {
    return this.zone.runOutsideAngular(async () => {
      const userRef = doc(this.firestore, 'users', uid);
      const snap = await getDoc(userRef as any);
      if (!snap.exists()) return [];
      const data: any = snap.data();
      return data.favoriteMovieIds || [];
    });
  }

  // Real-time observable of favorite IDs
  favorites$(uid: string) {
    const userRef = doc(this.firestore, 'users', uid);
    // Ensure AngularFire's docData is executed inside an Angular injection context
    return runInInjectionContext(this.injector, () =>
      docData(userRef as any) as Observable<{ favoriteMovieIds?: string[] } | undefined>
    );
  }

  async uploadProfilePhoto(uid: string, dataUrl: string) {
    return this.zone.runOutsideAngular(async () => {
      const storageRef = ref(this.storage, `profilePhotos/${uid}.jpg`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    });
  }
}
