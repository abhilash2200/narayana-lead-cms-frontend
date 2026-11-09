import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AddBranchComponent } from './add-branch.component';

describe('AddBranchComponent', () => {
  let component: AddBranchComponent;
  let fixture: ComponentFixture<AddBranchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddBranchComponent,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture =
      TestBed.createComponent(
        AddBranchComponent,
      );

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});