import { Injectable } from "@angular/core";
import { Auth, signInWithEmailAndPassword, signOut, User, authState, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { doc, Firestore, setDoc } from "@angular/fire/firestore";
import { RegisterData } from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$: Observable<User | null> = authState(this.auth);

  async login(email: string, password: string) {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      return cred.user;
    } catch (err) {
      // rethrow for the component to display
      throw err;
    }
  }

  async register(data: RegisterData) {
    const cred = await createUserWithEmailAndPassword(this.auth, data.email, data.password);

    await updateProfile(cred.user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    const userDoc = doc(this.firestore, 'users', cred.user.uid);

    await setDoc(userDoc, {
        id: cred.user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        email: data.email,
        role: 'user',
        isActive: true,
        favoriteMovieIds: [],
        photoBase64: null,
        createdAt: new Date()
    });

    console.log('User document created in Firestore with pyload:', userDoc);
    
    return cred.user;
  }

  async logout() {
    return signOut(this.auth);
  }
}