import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { Auth } from './auth';
import { AuthService } from '../../services/auth.service';

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  afterEach(() => authService.endDemoSession());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start a demo session and navigate home after valid form input', () => {
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

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    expect(authService.isAuthenticated()).toBe(true);
  });
});
