import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isInRange: boolean;
  isRangeBridge: boolean;
  isHoveredRange: boolean;
}

export interface PresetOption {
  label: string;
  getValue: () => { start: string; end: string };
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.component.html',
})
export class DateRangePickerComponent implements OnInit, OnChanges {
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() startDate = '';
  @Input() endDate = '';
  @Input() placeholder = 'Filter by date range...';
  @Input() disabled = false;

  @Output() rangeChange = new EventEmitter<DateRange>();
  @Output() startDateChange = new EventEmitter<string>();
  @Output() endDateChange = new EventEmitter<string>();

  isOpen = false;

  // Selected state
  selectedStart: string | null = null;
  selectedEnd: string | null = null;
  hoveredDate: string | null = null;

  // Calendar view navigation: month 1 (left) and month 2 (right)
  leftMonthDate = new Date();
  rightMonthDate = new Date();

  leftDays: CalendarDay[] = [];
  rightDays: CalendarDay[] = [];

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly presets: PresetOption[] = [
    {
      label: 'Today',
      getValue: () => {
        const today = this.formatDate(new Date());
        return { start: today, end: today };
      },
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yest = this.formatDate(d);
        return { start: yest, end: yest };
      },
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { start: this.formatDate(start), end: this.formatDate(end) };
      },
    },
    {
      label: 'Last 30 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return { start: this.formatDate(start), end: this.formatDate(end) };
      },
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: this.formatDate(start), end: this.formatDate(end) };
      },
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: this.formatDate(start), end: this.formatDate(end) };
      },
    },
  ];

  ngOnInit(): void {
    this.syncFromInputs();
    this.initMonthViews();
    this.rebuildCalendars();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      this.syncFromInputs();
      this.rebuildCalendars();
      this.cdr.markForCheck();
    }
  }

  private syncFromInputs(): void {
    this.selectedStart = this.startDate?.trim() || null;
    this.selectedEnd = this.endDate?.trim() || null;
  }

  private initMonthViews(): void {
    if (this.selectedStart) {
      const parsed = this.parseDate(this.selectedStart);
      if (parsed) {
        this.leftMonthDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        this.rightMonthDate = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 1);
        return;
      }
    }
    const today = new Date();
    this.leftMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.rightMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }

  toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.initMonthViews();
      this.rebuildCalendars();
    }
    this.cdr.markForCheck();
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.hoveredDate = null;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close();
  }

  prevMonth(): void {
    this.leftMonthDate = new Date(
      this.leftMonthDate.getFullYear(),
      this.leftMonthDate.getMonth() - 1,
      1
    );
    this.rightMonthDate = new Date(
      this.rightMonthDate.getFullYear(),
      this.rightMonthDate.getMonth() - 1,
      1
    );
    this.rebuildCalendars();
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    this.leftMonthDate = new Date(
      this.leftMonthDate.getFullYear(),
      this.leftMonthDate.getMonth() + 1,
      1
    );
    this.rightMonthDate = new Date(
      this.rightMonthDate.getFullYear(),
      this.rightMonthDate.getMonth() + 1,
      1
    );
    this.rebuildCalendars();
    this.cdr.markForCheck();
  }

  getMonthTitle(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  onDayClick(day: CalendarDay): void {
    const clicked = day.dateString;

    if (!this.selectedStart || (this.selectedStart && this.selectedEnd)) {
      // Starting new selection
      this.selectedStart = clicked;
      this.selectedEnd = null;
      this.hoveredDate = null;
    } else if (this.selectedStart && !this.selectedEnd) {
      // Completing selection
      if (clicked < this.selectedStart) {
        this.selectedEnd = this.selectedStart;
        this.selectedStart = clicked;
      } else {
        this.selectedEnd = clicked;
      }
      this.hoveredDate = null;
      this.emitChanges();
      this.close();
    }

    this.rebuildCalendars();
    this.cdr.markForCheck();
  }

  onDayHover(day: CalendarDay | null): void {
    if (this.selectedStart && !this.selectedEnd) {
      this.hoveredDate = day?.dateString || null;
      this.rebuildCalendars();
      this.cdr.markForCheck();
    }
  }

  applyPreset(preset: PresetOption): void {
    const range = preset.getValue();
    this.selectedStart = range.start;
    this.selectedEnd = range.end;
    this.emitChanges();
    this.initMonthViews();
    this.rebuildCalendars();
    this.close();
  }

  clearSelection(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedStart = null;
    this.selectedEnd = null;
    this.hoveredDate = null;
    this.emitChanges();
    this.rebuildCalendars();
    this.cdr.markForCheck();
  }

  private emitChanges(): void {
    const start = this.selectedStart || '';
    const end = this.selectedEnd || '';
    this.startDate = start;
    this.endDate = end;
    this.startDateChange.emit(start);
    this.endDateChange.emit(end);
    this.rangeChange.emit({ startDate: start, endDate: end });
  }

  get displayText(): string {
    if (!this.selectedStart && !this.selectedEnd) {
      return this.placeholder;
    }
    if (this.selectedStart && !this.selectedEnd) {
      return `${this.formatHumanDate(this.selectedStart)} – Select end date`;
    }
    if (this.selectedStart && this.selectedEnd) {
      if (this.selectedStart === this.selectedEnd) {
        return this.formatHumanDate(this.selectedStart);
      }
      return `${this.formatHumanDate(this.selectedStart)} – ${this.formatHumanDate(this.selectedEnd)}`;
    }
    return this.placeholder;
  }

  get hasSelection(): boolean {
    return Boolean(this.selectedStart || this.selectedEnd);
  }

  private rebuildCalendars(): void {
    this.leftDays = this.generateMonthDays(this.leftMonthDate);
    this.rightDays = this.generateMonthDays(this.rightMonthDate);
  }

  private generateMonthDays(monthDate: Date): CalendarDay[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = this.formatDate(new Date());
    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = this.formatDate(prevDate);
      days.push(this.createCalendarDay(prevDate, dateStr, false, dateStr === todayStr));
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      days.push(this.createCalendarDay(date, dateStr, true, dateStr === todayStr));
    }

    // Trailing days to complete the 35 or 42 grid slots
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = this.formatDate(nextDate);
      days.push(this.createCalendarDay(nextDate, dateStr, false, dateStr === todayStr));
    }

    return days;
  }

  private createCalendarDay(
    date: Date,
    dateString: string,
    isCurrentMonth: boolean,
    isToday: boolean
  ): CalendarDay {
    const start = this.selectedStart;
    const end = this.selectedEnd;
    const hover = this.hoveredDate;

    const isSelectedStart = start === dateString;
    const isSelectedEnd = end === dateString;

    let isInRange = false;
    let isRangeBridge = false;
    let isHoveredRange = false;

    if (start && end) {
      const rangeStart = start <= end ? start : end;
      const rangeEnd = start <= end ? end : start;
      isInRange = dateString >= rangeStart && dateString <= rangeEnd;
      isRangeBridge = dateString > rangeStart && dateString < rangeEnd;
    } else if (start && hover && !end) {
      const rangeStart = start <= hover ? start : hover;
      const rangeEnd = start <= hover ? hover : start;
      isHoveredRange = dateString >= rangeStart && dateString <= rangeEnd;
      isRangeBridge = dateString > rangeStart && dateString < rangeEnd;
    }

    return {
      date,
      dateString,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelectedStart,
      isSelectedEnd,
      isInRange,
      isRangeBridge,
      isHoveredRange,
    };
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDate(s: string): Date | null {
    if (!s) return null;
    const parts = s.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return null;
    }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private formatHumanDate(s: string): string {
    const parsed = this.parseDate(s);
    if (!parsed) return s;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
