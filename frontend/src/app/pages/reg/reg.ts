import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { isControlInvalid } from '../auth-form.utils';
import { AuthAsideComponent } from '../auth-aside/auth-aside.component';
import { AvatarIconComponent } from '../avatar-icon/avatar-icon.component';
import { AuthService } from '../../services/auth.service';
import { AvatarId, RegisterRequest } from '../auth.models';
import { AVATARS } from '../avatar.constants';

type RegisterStep = 'account' | 'character';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthAsideComponent, AvatarIconComponent],
  templateUrl: './reg.html',
  styleUrls: ['../auth/auth.css', './reg.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isInvalid = isControlInvalid;
  protected readonly avatars = AVATARS;
  protected readonly asideSteps = ['Зареєструйся', 'Створи персонажа'];

  protected readonly step = signal<RegisterStep>('account');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    name: ['', [Validators.required, Validators.maxLength(30)]],
    nickname: ['', [Validators.required, Validators.pattern(NICKNAME_PATTERN)]],
    avatarId: this.formBuilder.control<AvatarId | null>(null, Validators.required),
  });

  protected goToCharacterStep(): void {
    const { email, password } = this.form.controls;
    email.markAsTouched();
    password.markAsTouched();

    if (email.invalid || password.invalid) {
      return;
    }

    this.errorMessage.set(null);
    this.step.set('character');
  }

  protected goToAccountStep(): void {
    this.step.set('account');
  }

  protected selectAvatar(id: AvatarId): void {
    this.form.controls.avatarId.setValue(id);
    this.form.controls.avatarId.markAsTouched();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { avatarId, ...profile } = this.form.getRawValue();
    if (avatarId === null) {
      return;
    }

    const request: RegisterRequest = { ...profile, avatarId };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(request).subscribe({
      next: () => {
        this.authService.login({
          email: profile.email,
          password: profile.password,
        }).subscribe({
          next: (loginResponse) => {
            this.authService.startSession(loginResponse.access_token);
            this.isLoading.set(false);
            void this.router.navigate(['/home']);
          },
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set(
              'Реєстрація пройшла, але автоматичний вхід не вдався. Увійдіть вручну.',
            );
          },
        });
      },
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        const isEmailTaken = status === 409;
        if (isEmailTaken) {
          this.step.set('account');
        }
        this.errorMessage.set(
          status === 409
            ? 'Акаунт з таким email вже існує.'
            : status === 422
              ? 'Перевір email та пароль.'
              : status === 0
                ? 'Сервер реєстрації недоступний. Запусти бекенд і спробуй ще раз.'
                : 'Не вдалося зареєструватися. Спробуй ще раз.',
        );
        this.isLoading.set(false);
      },
    });
  }
}
