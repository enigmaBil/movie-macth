import { inject, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);
  const injector = inject(Injector);

  const user = auth.currentUser;
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const userDocSnap = await runInInjectionContext(injector, () => getDoc(doc(firestore, `users/${user.uid}`)));
    const userData = userDocSnap.data();

    if (userData?.['role'] === 'admin' && userData?.['isActive']) {
      return true;
    }

    // Not an admin or not active, redirect to home
    router.navigate(['/']);
    return false;
  } catch (error) {
    console.error('Admin guard error:', error);
    router.navigate(['/']);
    return false;
  }
};