import { Component, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
// (rx imports consolidated above)

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel
  ]
})
export class AppComponent {
  isAdmin$: Observable<boolean> | null = null;
  displayName$: Observable<string | null> | null = null;
  isAuthenticated$: Observable<boolean> | null = null;

  constructor(private auth: Auth, private firestore: Firestore) {
    // Use onAuthStateChanged to react quickly when user logs in/out
    const injector = inject(Injector);

    this.displayName$ = new Observable<string | null>(subscriber => {
      // run the listener inside Angular's injection context to avoid AngularFire "outside injection context" warnings
      const off = runInInjectionContext(injector, () =>
        onAuthStateChanged(this.auth, user => {
          subscriber.next(user ? (user.displayName || user.email || null) : null);
        })
      );
      return { unsubscribe: off };
    });

    this.isAuthenticated$ = new Observable<boolean>(subscriber => {
      const off = runInInjectionContext(injector, () =>
        onAuthStateChanged(this.auth, user => subscriber.next(!!user))
      );
      return { unsubscribe: off };
    });

    // Compute isAdmin$ by re-checking Firestore when auth state changes
    this.isAdmin$ = new Observable<boolean>(subscriber => {
      const off = runInInjectionContext(injector, () =>
        onAuthStateChanged(this.auth, user => {
          if (!user) {
            subscriber.next(false);
            return;
          }
          // fetch user doc inside injection context
          runInInjectionContext(injector, async () => {
            try {
              const userDocRef = doc(this.firestore, `users/${user.uid}`);
              const snap = await getDoc(userDocRef);
              const data: any = snap.data();
              subscriber.next(!!(data && data.role === 'admin' && data.isActive === true));
            } catch (err) {
              console.error('isAdmin check failed', err);
              subscriber.next(false);
            }
          });
        })
      );
      return { unsubscribe: off };
    });
  }

  private async waitForUser(): Promise<any> {
    // Simple helper: wait until auth.currentUser is set (if already logged in it returns immediately)
    const timeout = 5000; // 5s max
    const start = Date.now();
    while (!this.auth.currentUser && Date.now() - start < timeout) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 100));
    }
    return this.auth.currentUser;
  }
}
