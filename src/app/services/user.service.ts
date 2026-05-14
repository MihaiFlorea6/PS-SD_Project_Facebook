import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';
  private authUrl = 'http://localhost:8080/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isModerator(): boolean {
    return this.currentUser?.role === 'MODERATOR';
  }

  /**
   * Login REAL — trimite username + parola la backend.
   * Backend-ul verifica BCrypt si returneaza userul sau eroare.
   * Daca userul e banat, backend-ul returneaza 403 cu error: "BANNED".
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.authUrl}/login`, { username, password }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        // Propagam eroarea mai departe ca sa o prinda componenta
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  register(username: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(this.apiUrl, { username, email, password });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, username: string, email: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, { username, email });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // BONUS: Baneaza un utilizator (doar moderatori)
  banUser(targetUserId: number): Observable<User> {
    const moderatorId = this.currentUser?.id;
    return this.http.post<User>(`${this.apiUrl}/${targetUserId}/ban`, { moderatorId });
  }

  // BONUS: Debaneaza un utilizator (doar moderatori)
  unbanUser(targetUserId: number): Observable<User> {
    const moderatorId = this.currentUser?.id;
    return this.http.post<User>(`${this.apiUrl}/${targetUserId}/unban`, { moderatorId });
  }
}
