import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RightSchoolComponent } from './right-school.component';

describe('RightSchoolComponent', () => {
  let component: RightSchoolComponent;
  let fixture: ComponentFixture<RightSchoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightSchoolComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RightSchoolComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
