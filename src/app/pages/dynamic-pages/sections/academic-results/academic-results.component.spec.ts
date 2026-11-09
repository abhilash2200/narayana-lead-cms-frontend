import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicResultsComponent } from './academic-results.component';

describe('AcademicResultsComponent', () => {
  let component: AcademicResultsComponent;
  let fixture: ComponentFixture<AcademicResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicResultsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
