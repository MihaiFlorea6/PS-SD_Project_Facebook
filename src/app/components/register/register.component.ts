import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private userService: UserService, private router: Router) {}

  register(): void {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.error = 'Completează toate câmpurile.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.userService.register(this.username, this.email, this.password).subscribe({
      next: user => {
        // Auto-login after register
        this.userService.login(this.username, this.password).subscribe({
          next: () => this.router.navigate(['/posts'])
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Eroare la înregistrare. Username sau email deja folosit.';
      }
    });
  }
}
