import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnConfig } from '../../models/lead-columns.config';

@Component({
  selector: 'app-lead-columns-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './lead-columns-dropdown.component.html',
})
export class LeadColumnsDropdownComponent {
  @Input() isOpen = false;
  @Input() columns: ColumnConfig[] = [];
  @Input() visibleColumnCount = 0;
  @Input() draggedColIndex: number | null = null;
  @Input() dragOverColIndex: number | null = null;

  @Output() toggleOpen = new EventEmitter<void>();
  @Output() columnToggled = new EventEmitter<string>();
  @Output() allToggled = new EventEmitter<boolean>();
  @Output() columnMoved = new EventEmitter<{ index: number; direction: 'up' | 'down'; event?: Event }>();
  @Output() orderReset = new EventEmitter<void>();
  @Output() widthsReset = new EventEmitter<void>();
  @Output() dragStarted = new EventEmitter<{ event: DragEvent; index: number }>();
  @Output() dragOvered = new EventEmitter<{ event: DragEvent; index: number }>();
  @Output() dragLeft = new EventEmitter<{ event: DragEvent; index: number }>();
  @Output() dropped = new EventEmitter<{ event: DragEvent; index: number }>();
  @Output() dragEnded = new EventEmitter<void>();

  onToggleOpen(): void {
    this.toggleOpen.emit();
  }

  onToggleColumn(key: string): void {
    this.columnToggled.emit(key);
  }

  onToggleAll(visible: boolean): void {
    this.allToggled.emit(visible);
  }

  onMove(index: number, direction: 'up' | 'down', event?: Event): void {
    this.columnMoved.emit({ index, direction, event });
  }

  onResetOrder(): void {
    this.orderReset.emit();
  }

  onResetWidths(): void {
    this.widthsReset.emit();
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragStarted.emit({ event, index });
  }

  onDragOver(event: DragEvent, index: number): void {
    this.dragOvered.emit({ event, index });
  }

  onDragLeave(event: DragEvent, index: number): void {
    this.dragLeft.emit({ event, index });
  }

  onDrop(event: DragEvent, index: number): void {
    this.dropped.emit({ event, index });
  }

  onDragEnd(): void {
    this.dragEnded.emit();
  }
}
