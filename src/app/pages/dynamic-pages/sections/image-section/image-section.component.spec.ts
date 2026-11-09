import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSectionComponent } from './image-section.component';

describe('ImageSectionComponent', () => {
  let component: ImageSectionComponent;
  let fixture: ComponentFixture<ImageSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
