import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/** Guard para rutas que requieren autenticación */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.checkAuth() && auth.validateSession()) {
    return true;
  }

  router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Guard para rutas de admin */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.checkAuth() || !auth.validateSession()) {
    router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (auth.isAdmin()) return true;

  router.navigate(['/']); // sin permisos
  return false;
};

/** Guard de login (redirige si ya está autenticado) */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.checkAuth() && auth.validateSession()) {
    router.navigate(['/admin']);
    return false;
  }
  return true;
};

/** Guard para rutas públicas que no deberían verse cuando hay sesión */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.checkAuth() && auth.validateSession()) {
    router.navigate([auth.isAdmin() ? '/admin' : '/']);
    return false;
  }
  return true;
};
