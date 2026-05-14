import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banned',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './banned.component.html',
  styleUrls: ['./banned.component.scss']
})
export class BannedComponent {}
