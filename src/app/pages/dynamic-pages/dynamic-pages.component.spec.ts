import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DynamicPagesComponent } from './dynamic-pages.component';

describe('DynamicPagesComponent', () => {
  let component: DynamicPagesComponent;
  let fixture: ComponentFixture<DynamicPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicPagesComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicPagesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
