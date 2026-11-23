import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})
export class Auth {
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  navigateToHome(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.submitting.set(false);
        localStorage.setItem('access_token', result.access_token);
        void this.router.navigate(['/home']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        this.errorMessage.set(
          status === 401
            ? 'Неправильна електронна пошта або пароль.'
            : status === 0
              ? 'Сервер недоступний. Запусти бекенд і спробуй ще раз.'
              : 'Не вдалося увійти. Спробуй ще раз.',
        );
      },
    });
  }
}
