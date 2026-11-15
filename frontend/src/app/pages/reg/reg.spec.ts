import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Reg } from './reg';

describe('Reg', () => {
  let component: Reg;
  let fixture: ComponentFixture<Reg>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reg],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Reg);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => httpTestingController.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit the agreed registration payload and show success', () => {
    component.form.setValue({ email: 'andrii@example.com', password: 'MyPassword123!' });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.click();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'andrii@example.com', password: 'MyPassword123!' });
    request.flush({ id: 1, email: 'andrii@example.com' }, { status: 201, statusText: 'Created' });

    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent)
      .toContain('Акаунт створено для andrii@example.com.');
  });

  it('should stop submitting and explain when the backend is unavailable', () => {
    component.form.setValue({ email: 'andrii@example.com', password: 'MyPassword123!' });
    component.submit();

    const request = httpTestingController.expectOne('http://127.0.0.1:8000/auth/register');
    request.error(new ProgressEvent('error'));

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toContain('Сервер реєстрації недоступний');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('Сервер реєстрації недоступний');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      )?.disabled,
    ).toBe(false);
  });
});