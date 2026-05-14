import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/posts', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  // BONUS: pagina pentru useri banati
  { path: 'banned', loadComponent: () => import('./components/banned/banned.component').then(m => m.BannedComponent) },
  { path: 'posts', loadComponent: () => import('./components/post-list/post-list.component').then(m => m.PostListComponent), canActivate: [authGuard] },
  { path: 'posts/new', loadComponent: () => import('./components/post-form/post-form.component').then(m => m.PostFormComponent), canActivate: [authGuard] },
  { path: 'posts/:id', loadComponent: () => import('./components/post-detail/post-detail.component').then(m => m.PostDetailComponent), canActivate: [authGuard] },
  { path: 'posts/:id/edit', loadComponent: () => import('./components/post-form/post-form.component').then(m => m.PostFormComponent), canActivate: [authGuard] },
  { path: 'users', loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/posts' }
];
