import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  BranchListComponent,
} from './branch-list.component';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe(
  'BranchListComponent',
  () => {

    let component: BranchListComponent;

    let fixture:
      ComponentFixture<BranchListComponent>;

    beforeEach(
      async () => {

        await TestBed.configureTestingModule({
          imports: [
            BranchListComponent,
          ],
          providers: [provideRouter([]), provideHttpClient()],
        }).compileComponents();

        fixture =
          TestBed.createComponent(
            BranchListComponent,
          );

        component =
          fixture.componentInstance;

        await fixture.whenStable();
      },
    );

    it(
      'should create',
      () => {

        expect(component)
          .toBeTruthy();

      },
    );

  },
);