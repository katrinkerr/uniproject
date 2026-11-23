import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { Auth } from './auth';
import { AuthApiService } from '../../services/auth-api.service';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            login: vi.fn(() =>
              of({ access_token: 'test-token', token_type: 'bearer' as const }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to home when the login button is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({
      email: 'student@example.com',
      password: 'StrongPassword123!',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });
});
