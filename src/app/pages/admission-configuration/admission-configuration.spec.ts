import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdmissionConfiguration } from './admission-configuration';

describe('AdmissionConfiguration', () => {
  let component: AdmissionConfiguration;
  let fixture: ComponentFixture<AdmissionConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionConfiguration],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdmissionConfiguration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
