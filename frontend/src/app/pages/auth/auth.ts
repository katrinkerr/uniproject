import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})
export class Auth {
  private readonly router = inject(Router);

  navigateToHome(): void {
    void this.router.navigate(['/home']);
  }
}
