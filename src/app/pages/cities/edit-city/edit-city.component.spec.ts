import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { EditCityComponent } from './edit-city.component';

describe('EditCityComponent', () => {
  let component: EditCityComponent;
  let fixture: ComponentFixture<EditCityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCityComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCityComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});