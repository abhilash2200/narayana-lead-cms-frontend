import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderSectionComponent } from './header-section.component';

describe('HeaderSectionComponent', () => {
  let component: HeaderSectionComponent;
  let fixture: ComponentFixture<HeaderSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
