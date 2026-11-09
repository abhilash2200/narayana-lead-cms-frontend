import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParentsSayComponent } from './parents-say.component';

describe('ParentsSayComponent', () => {
  let component: ParentsSayComponent;
  let fixture: ComponentFixture<ParentsSayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentsSayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParentsSayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
