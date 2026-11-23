import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { RegisterComponent } from './reg';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => httpTestingController.verify());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should register valid details and navigate to login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    fillRegistrationForm(fixture);

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'andrii@example.com',
      password: 'MyPassword123!',
    });
    request.flush({ id: 1, email: 'andrii@example.com' }, { status: 201, statusText: 'Created' });

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show a clear error when the registration server is unavailable', () => {
    fixture.detectChanges();
    fillRegistrationForm(fixture);

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/register');
    request.error(new ProgressEvent('error'));

    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Сервер реєстрації недоступний',
    );
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  });
});

function fillRegistrationForm(fixture: ComponentFixture<RegisterComponent>): void {
  const element = fixture.nativeElement as HTMLElement;
  const enterValue = (selector: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Missing input: ${selector}`);
    }

    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  enterValue('#email', 'andrii@example.com');
  enterValue('#password', 'MyPassword123!');
  element.querySelector<HTMLButtonElement>('button[type="button"]')?.click();
  fixture.detectChanges();
  element.querySelector<HTMLButtonElement>('[role="radio"]')?.click();
  enterValue('#name', 'Andrii');
  enterValue('#nickname', 'andrii_1');
  fixture.detectChanges();
  element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
}
