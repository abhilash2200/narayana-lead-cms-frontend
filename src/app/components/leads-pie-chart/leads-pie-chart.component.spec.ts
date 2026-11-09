import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadsPieChartComponent } from './leads-pie-chart.component';

describe('LeadsPieChartComponent', () => {
  let component: LeadsPieChartComponent;
  let fixture: ComponentFixture<LeadsPieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsPieChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsPieChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
