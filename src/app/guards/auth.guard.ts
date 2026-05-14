import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const user = userService.currentUser;

  // Nu e logat deloc
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // BONUS: Userul e banat — trimitem la pagina de banned
  if (user.banned) {
    userService.logout();
    router.navigate(['/banned']);
    return false;
  }

  return true;
};
