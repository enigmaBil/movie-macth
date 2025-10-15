import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.currentUser;
  if (user) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(private auth: Auth, private router: Router) {}
}
