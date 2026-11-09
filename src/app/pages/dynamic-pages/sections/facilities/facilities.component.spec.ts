import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FacilitiesComponent } from './facilities.component';

describe('FacilitiesComponent', () => {
  let component: FacilitiesComponent;
  let fixture: ComponentFixture<FacilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilitiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
