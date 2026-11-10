import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseListItem } from '../course.component';

@Component({
  selector: 'app-course-feature-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './course-feature-group.component.html',
})
export class CourseFeatureGroupComponent {
  @Input() groupIndex: number = 1;
  @Input() label: string = 'Sub Heading';
  @Input() placeholder: string = 'Enter sub heading';
  @Input() subHeading: string = '';
  @Input() icon?: string = 'TRENDING_UP';
  @Input() listItems: CourseListItem[] = [];

  @Output() subHeadingChange = new EventEmitter<string>();
  @Output() iconChange = new EventEmitter<string>();
  @Output() addPoint = new EventEmitter<void>();
  @Output() removePoint = new EventEmitter<number>();
  @Output() contentChange = new EventEmitter<void>();

  onSubHeadingChange(val: string): void {
    this.subHeading = val;
    this.subHeadingChange.emit(val);
    this.contentChange.emit();
  }

  onIconChange(val: string): void {
    this.icon = val;
    this.iconChange.emit(val);
    this.contentChange.emit();
  }

  onPointChange(): void {
    this.contentChange.emit();
  }

  onAddPoint(): void {
    this.addPoint.emit();
  }

  onRemovePoint(id: number): void {
    this.removePoint.emit(id);
  }
}
