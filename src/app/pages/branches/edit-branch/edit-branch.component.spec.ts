import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { EditBranchComponent } from './edit-branch.component';

describe('EditBranchComponent', () => {
  let component: EditBranchComponent;
  let fixture: ComponentFixture<EditBranchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBranchComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditBranchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
