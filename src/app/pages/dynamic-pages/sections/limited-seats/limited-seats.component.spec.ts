import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LimitedSeatsComponent } from './limited-seats.component';

describe('LimitedSeatsComponent', () => {
  let component: LimitedSeatsComponent;
  let fixture: ComponentFixture<LimitedSeatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LimitedSeatsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LimitedSeatsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
