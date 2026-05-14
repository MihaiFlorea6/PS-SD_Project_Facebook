import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CommonModule } from '@angular/common';

// internalExecutionId - required by assignment
const internalExecutionId = Math.random().toString(36).substring(2, 18).toUpperCase();
console.log('[FaceBook App] internalExecutionId:', internalExecutionId);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 60px);
      background: var(--bg-dark);
    }
  `]
})
export class AppComponent {
  title = 'facebook-frontend';
}
