import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-cta-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './course-cta-row.component.html',
})
export class CourseCtaRowComponent {
  @Input() label: string = 'Button';
  @Input() textLabel: string = 'Button Text';
  @Input() textPlaceholder: string = 'Enter button text';
  @Input() urlLabel: string = 'Button URL';
  @Input() urlPlaceholder: string = 'Enter button URL';

  @Input() buttonText: string = '';
  @Input() buttonUrl: string = '';

  @Output() buttonTextChange = new EventEmitter<string>();
  @Output() buttonUrlChange = new EventEmitter<string>();
  @Output() contentChange = new EventEmitter<void>();

  onTextChange(val: string): void {
    this.buttonText = val;
    this.buttonTextChange.emit(val);
    this.contentChange.emit();
  }

  onUrlChange(val: string): void {
    this.buttonUrl = val;
    this.buttonUrlChange.emit(val);
    this.contentChange.emit();
  }
}
