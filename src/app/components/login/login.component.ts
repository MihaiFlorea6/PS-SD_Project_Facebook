import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  isBanned = false;

  constructor(private userService: UserService, private router: Router) {}

  login(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Completează toate câmpurile.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.isBanned = false;

    this.userService.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/posts']),
      error: (err) => {
        this.loading = false;
        // BONUS: detectam daca userul e banat
        if (err?.error?.error === 'BANNED') {
          this.isBanned = true;
          this.error = 'Contul tău a fost blocat de un moderator.';
          this.router.navigate(['/banned']);
        } else if (err?.status === 401) {
          this.error = 'Utilizator sau parolă incorectă.';
        } else {
          this.error = 'Eroare la conectare. Încearcă din nou.';
        }
      }
    });
  }
}
