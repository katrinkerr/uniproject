import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { Home } from './home';
import { AuthService } from '../../services/auth.service';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
    authService.endSession();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log out and navigate to login', async () => {
    authService.startSession('test-token');
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const logoutButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.logout-btn',
    ) as HTMLButtonElement | null;
    logoutButton?.click();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush(null);

    expect(authService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
