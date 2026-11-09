import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadsBarChartComponent } from './leads-bar-chart.component';

describe('LeadsBarChartComponent', () => {
  let component: LeadsBarChartComponent;
  let fixture: ComponentFixture<LeadsBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsBarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsBarChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
