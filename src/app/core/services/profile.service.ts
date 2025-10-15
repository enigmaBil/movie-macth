import { Injectable } from '@angular/core';
import { Auth, updateProfile, updateEmail as fbUpdateEmail, updatePassword as fbUpdatePassword } from '@angular/fire/auth';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Récupère le profil complet (Firestore + Auth)
  getCurrentUserProfile(): Observable<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return of(null);

    const userDocRef = doc(this.firestore, 'users', currentUser.uid);
    return from(getDoc(userDocRef)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of(snapshot.data() as User);
        }
        return of(null);
      })
    );
  }

  // Met à jour prénom, nom, âge + displayName dans Auth
  async updateBasicInfo(firstName: string, lastName: string, age: number): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await updateProfile(user, { displayName: `${firstName} ${lastName}` });

    const userDoc = doc(this.firestore, 'users', user.uid);
    await updateDoc(userDoc, { firstName, lastName, age });
  }

  // Sauvegarde la photo (Data URL) dans Firestore
  async updateProfilePhoto(uid: string, dataUrl: string): Promise<void> {
    if (dataUrl.length > 900_000) {
      throw new Error('Image trop grande. Veuillez réduire la qualité ou la taille.');
    }
    const userDoc = doc(this.firestore, 'users', uid);
    await updateDoc(userDoc, { photoDataUrl: dataUrl });
  }

  // Met à jour l'email de l'utilisateur (Auth + Firestore)
  async updateEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await fbUpdateEmail(user, newEmail);
    const userDoc = doc(this.firestore, 'users', user.uid);
    await updateDoc(userDoc, { email: newEmail });
  }

  // Met à jour le mot de passe de l'utilisateur
  async updatePassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await fbUpdatePassword(user, newPassword);
  }
}