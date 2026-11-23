import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { Auth } from './auth';
import { AuthService } from '../../services/auth.service';

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let router: Router;
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
    authService.endSession();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should login, start a session and navigate home after valid form input', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    const passwordInput = element.querySelector<HTMLInputElement>('#password');
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();

    emailInput!.value = 'user@example.com';
    emailInput!.dispatchEvent(new Event('input'));
    passwordInput!.value = 'Password123!';
    passwordInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'user@example.com',
      password: 'Password123!',
    });
    request.flush({ access_token: 'test-token', token_type: 'bearer' });

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should show an error for invalid credentials', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    const passwordInput = element.querySelector<HTMLInputElement>('#password');

    emailInput!.value = 'user@example.com';
    emailInput!.dispatchEvent(new Event('input'));
    passwordInput!.value = 'Password123!';
    passwordInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/login');
    request.flush({ detail: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Невірний email або пароль');
  });

  it('should explain when the login endpoint is not implemented', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    const passwordInput = element.querySelector<HTMLInputElement>('#password');

    emailInput!.value = 'user@example.com';
    emailInput!.dispatchEvent(new Event('input'));
    passwordInput!.value = 'Password123!';
    passwordInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/login');
    request.flush({ detail: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('/auth/login');
  });
});
