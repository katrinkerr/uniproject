import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Reg } from './reg';

describe('Reg', () => {
  let component: Reg;
  let fixture: ComponentFixture<Reg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reg],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Reg);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
