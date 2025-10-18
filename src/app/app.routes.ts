import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
        {
          path: 'admin',
          children: [
            { path: 'users', loadComponent: () => import('./pages/admin/users/admin-users.page').then(m => m.AdminUsersPage), canActivate: [() => import('./core/guards/admin.guard').then(m => m.adminGuard)] },
            { path: 'movies', loadComponent: () => import('./pages/admin/movies/admin-movies.page').then(m => m.AdminMoviesPage), canActivate: [() => import('./core/guards/admin.guard').then(m => m.adminGuard)] },
            { path: '', redirectTo: 'users', pathMatch: 'full' }
          ]
        },
      {
        path: 'movie/:id',
        loadComponent: () => import('./pages/movie-details/movie-details.page').then(m => m.MovieDetailsPage)
      },
      {
        path: 'matching',
        loadComponent: () => import('./pages/matching/matching.page').then(m => m.MatchingPage),
        canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.page').then(m => m.FavoritesPage),
        canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
        canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'play-list',
    loadComponent: () => import('./pages/play-list/play-list.page').then( m => m.PlayListPage)
  },
  
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
        canActivate: [() => import('./core/guards/admin.guard').then(m => m.adminGuard)]
      },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  }
];
