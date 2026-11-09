import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AddDynamicPageComponent } from './add-dynamic-page.component';

describe('AddDynamicPageComponent', () => {
  let component: AddDynamicPageComponent;
  let fixture: ComponentFixture<AddDynamicPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDynamicPageComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDynamicPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
