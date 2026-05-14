import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  currentUser: User | null = null;
  isModerator = false;

  editingUserId: number | null = null;
  editUsername = '';
  editEmail = '';

  constructor(
    private userService: UserService,
    public voteService: VoteService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
    this.isModerator = this.userService.isModerator();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: () => { this.loading = false; alert('Eroare la încărcarea utilizatorilor.'); }
    });
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.editUsername = user.username;
    this.editEmail = user.email;
  }

  cancelEdit(): void {
    this.editingUserId = null;
  }

  saveEdit(user: User): void {
    this.userService.updateUser(user.id, this.editUsername, this.editEmail).subscribe({
      next: updated => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
        if (this.currentUser?.id === updated.id) {
          localStorage.setItem('currentUser', JSON.stringify(updated));
        }
        this.editingUserId = null;
      },
      error: () => alert('Eroare la actualizarea utilizatorului.')
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Ștergi utilizatorul ${user.username}?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        if (this.currentUser?.id === user.id) {
          this.userService.logout();
        }
      },
      error: () => alert('Eroare la ștergerea utilizatorului.')
    });
  }

  // BONUS: Baneaza un utilizator
  banUser(user: User): void {
    if (!confirm(`Banezi utilizatorul ${user.username}? Acesta nu va mai putea accesa aplicația.`)) return;
    this.userService.banUser(user.id).subscribe({
      next: updated => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
      },
      error: (err) => alert(err?.error?.error || 'Eroare la banare.')
    });
  }

  // BONUS: Debaneaza un utilizator
  unbanUser(user: User): void {
    if (!confirm(`Debanezi utilizatorul ${user.username}?`)) return;
    this.userService.unbanUser(user.id).subscribe({
      next: updated => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
      },
      error: (err) => alert(err?.error?.error || 'Eroare la debanare.')
    });
  }

  isCurrentUser(user: User): boolean {
    return this.currentUser?.id === user.id;
  }
}
