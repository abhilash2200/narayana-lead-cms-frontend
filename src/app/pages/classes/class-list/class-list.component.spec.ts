import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  ClassListComponent,
} from './class-list.component';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe(
  'ClassListComponent',
  () => {

    let component: ClassListComponent;

    let fixture:
      ComponentFixture<ClassListComponent>;

    beforeEach(
      async () => {

        await TestBed.configureTestingModule({
          imports: [
            ClassListComponent,
          ],
          providers: [provideRouter([]), provideHttpClient()],
        }).compileComponents();

        fixture =
          TestBed.createComponent(
            ClassListComponent,
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