import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterApiService } from '../../services/register-api.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-reg',
  styleUrl: './reg.css',
  templateUrl: './reg.html',
})
export class Reg {
  private readonly registerApi = inject(RegisterApiService);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    }),
  });

  submitting = false;
  successMessage = '';
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.registerApi.register(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.submitting = false;
        this.successMessage = `Акаунт створено для ${result.email}.`;
        this.form.reset();
      },
      error: (error: unknown) => {
        this.submitting = false;
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        this.errorMessage = status === 409
          ? 'Ця електронна пошта вже зареєстрована.'
          : status === 422
            ? 'Перевір електронну пошту та пароль.'
            : status === 0
              ? 'Сервер реєстрації недоступний. Запусти бекенд і спробуй ще раз.'
              : 'Не вдалося створити акаунт. Спробуй ще раз.';
      },
    });
  }
}