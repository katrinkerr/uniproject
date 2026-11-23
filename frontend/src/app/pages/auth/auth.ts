import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { AuthAsideComponent } from '../auth-aside/auth-aside.component';
import { isControlInvalid } from '../auth-form.utils';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthAsideComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isInvalid = isControlInvalid;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.authService.startSession(response.access_token);
        void this.router.navigate(['/home']);
      },
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        this.errorMessage.set(
          status === 401
            ? 'Невірний email або пароль.'
            : status === 404
              ? 'Endpoint входу на сервері недоступний: /auth/login.'
            : status === 422
              ? 'Перевір email та пароль.'
              : status === 0
                ? 'Сервер авторизації недоступний. Запусти бекенд і спробуй ще раз.'
                : 'Не вдалося увійти. Спробуй ще раз.',
        );
        this.isLoading.set(false);
      },
    });
  }
}
