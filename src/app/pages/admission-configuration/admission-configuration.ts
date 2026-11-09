import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';

import {
  AdmissionOptionsService,
  CreateAdmissionOptionRequest,
  AdmissionOption,
} from '../../services/admission-options.service';
import { City, CityService } from '../../services/city.service';
import { Branch, BranchService } from '../../services/branch.service';
import { ClassMaster, ClassService } from '../../services/class.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';

@Component({
  selector: 'app-admission-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './admission-configuration.html',
})
export class AdmissionConfiguration implements OnInit {
  protected readonly Number = Number;
  private readonly admissionOptionsService = inject(AdmissionOptionsService);
  private readonly cityService = inject(CityService);
  private readonly branchService = inject(BranchService);
  private readonly classService = inject(ClassService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isSaving = false;
  isArchivingId: number | string | null = null;

  // Modal State
  isModalOpen = false;
  searchTerm = '';

  errorMessage = '';
  loadError = '';

  // Toast State
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  admissionOptions: AdmissionOption[] = [];
  editingId: number | string | null = null;

  cities: City[] = [];
  branches: Branch[] = [];
  classes: ClassMaster[] = [];

  form: CreateAdmissionOptionRequest = this.getEmptyForm();

  ngOnInit(): void {
    this.loadAllData();
  }

  getEmptyForm(): CreateAdmissionOptionRequest {
    return {
      city_id: 0,
      branch_id: 0,
      board_code: '',
      board_name: '',
      reservation_code: '',
      reservation_name: '',
      class_id: 0,
      status: 'ACTIVE',
      sort_order: 0,
    };
  }

  get availableBranches(): Branch[] {
    if (!this.form.city_id || this.form.city_id === 0) {
      return [];
    }
    return this.branches.filter((b) => Number(b.city_id) === Number(this.form.city_id));
  }

  get filteredAdmissionOptions(): AdmissionOption[] {
    if (!this.searchTerm.trim()) {
      return this.admissionOptions;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.admissionOptions.filter((opt) => {
      const cityName = this.getCityName(opt.city_id).toLowerCase();
      const branchName = this.getBranchName(opt.branch_id).toLowerCase();
      const className = this.getClassName(opt.class_id).toLowerCase();
      const board = (opt.board_name + ' ' + opt.board_code).toLowerCase();
      const res = (opt.reservation_name + ' ' + opt.reservation_code).toLowerCase();
      return (
        cityName.includes(term) ||
        branchName.includes(term) ||
        className.includes(term) ||
        board.includes(term) ||
        res.includes(term) ||
        String(opt.id).includes(term)
      );
    });
  }

  onCityChange(): void {
    this.form.branch_id = 0;
  }

  openCreateModal(): void {
    this.editingId = null;
    this.form = this.getEmptyForm();
    this.errorMessage = '';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
    this.editingId = null;
    this.form = this.getEmptyForm();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadError = '';
    this.cdr.detectChanges();

    forkJoin({
      citiesRes: this.cityService.getCities().pipe(catchError(() => of({ success: false, data: [] as City[] }))),
      branchesRes: this.branchService.getBranches().pipe(catchError(() => of({ success: false, data: [] as Branch[] }))),
      classesRes: this.classService.getClasses().pipe(catchError(() => of({ success: false, data: [] as ClassMaster[] }))),
      optionsRes: this.admissionOptionsService.getAdmissionOptions().pipe(catchError(() => of({ success: false, data: [] as AdmissionOption[] }))),
    }).subscribe({
      next: ({ citiesRes, branchesRes, classesRes, optionsRes }) => {
        this.isLoading = false;

        this.cities = (citiesRes.data || []).sort(
          (a, b) => (Number(a.sort_order) || 999) - (Number(b.sort_order) || 999)
        );
        this.branches = branchesRes.data || [];
        this.classes = (classesRes.data || []).sort(
          (a, b) => (Number(a.sort_order) || 999) - (Number(b.sort_order) || 999)
        );

        this.admissionOptions = Array.isArray(optionsRes.data)
          ? optionsRes.data
          : [];

        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.loadError = 'Unable to load admission options and master data.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Load data error:', error);
      },
    });
  }

  loadAdmissionOptions(): void {
    this.admissionOptionsService.getAdmissionOptions().subscribe({
      next: (response) => {
        this.admissionOptions = Array.isArray(response.data)
          ? response.data
          : [];
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.loadError = 'Unable to refresh admission options.';
        this.cdr.detectChanges();
        console.error('Load admission options error:', error);
      },
    });
  }

  getCityName(cityId: number): string {
    const city = this.cities.find((c) => Number(c.id) === Number(cityId));
    return city ? city.name : `City #${cityId}`;
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find((b) => Number(b.id) === Number(branchId));
    return branch ? branch.name : `Branch #${branchId}`;
  }

  getClassName(classId: number): string {
    const cls = this.classes.find((cl) => Number(cl.id) === Number(classId));
    return cls ? cls.name : `Class #${classId}`;
  }

  saveAdmissionOption(): void {
    this.errorMessage = '';

    const payload: CreateAdmissionOptionRequest = {
      ...this.form,
      city_id: Number(this.form.city_id),
      branch_id: Number(this.form.branch_id),
      class_id: Number(this.form.class_id),
      sort_order: Number(this.form.sort_order),
      board_code: this.form.board_code.trim(),
      board_name: this.form.board_name.trim(),
      reservation_code: this.form.reservation_code.trim(),
      reservation_name: this.form.reservation_name.trim(),
    };

    if (
      !Number.isInteger(payload.city_id) ||
      payload.city_id < 1 ||
      !Number.isInteger(payload.branch_id) ||
      payload.branch_id < 1 ||
      !Number.isInteger(payload.class_id) ||
      payload.class_id < 1 ||
      !payload.board_code ||
      !payload.board_name ||
      !payload.reservation_code ||
      !payload.reservation_name ||
      !Number.isInteger(payload.sort_order) ||
      payload.sort_order < 0
    ) {
      this.errorMessage = 'Please select a valid City, Branch, Class, and enter all Board and Reservation fields.';
      this.cdr.detectChanges();
      return;
    }

    const isEditing = this.editingId !== null;
    this.isSaving = true;
    this.cdr.detectChanges();

    const request$ = isEditing
      ? this.admissionOptionsService.updateAdmissionOption(
          this.editingId as number | string,
          payload
        )
      : this.admissionOptionsService.createAdmissionOption(payload);

    request$.subscribe({
      next: (response) => {
        this.isSaving = false;

        if (response.success) {
          const msg = isEditing
            ? 'Admission option updated successfully.'
            : 'Admission option saved successfully.';

          this.isModalOpen = false;
          this.editingId = null;
          this.form = this.getEmptyForm();
          this.showToast(msg, 'success');
          this.loadAdmissionOptions();
        } else {
          this.errorMessage =
            response.message || 'Unable to save admission option.';
        }
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.errorMessage =
          'Unable to save admission option. Check the required values and try again.';
        this.cdr.detectChanges();
        console.error('Save admission option error:', error);
      },
    });
  }

  editAdmissionOption(option: AdmissionOption): void {
    this.editingId = option.id;
    this.errorMessage = '';

    this.form = {
      city_id: Number(option.city_id),
      branch_id: Number(option.branch_id),
      board_code: option.board_code,
      board_name: option.board_name,
      reservation_code: option.reservation_code,
      reservation_name: option.reservation_name,
      class_id: Number(option.class_id),
      status: option.status || 'ACTIVE',
      sort_order: Number(option.sort_order),
    };

    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  archiveAdmissionOption(option: AdmissionOption): void {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${option.board_name}" option?`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.isArchivingId = option.id;
    this.cdr.detectChanges();

    this.admissionOptionsService.archiveAdmissionOption(option.id).subscribe({
      next: (response) => {
        this.isArchivingId = null;

        if (response.success) {
          const msg = response.message || 'Admission option archived.';
          this.showToast(msg, 'success');

          if (this.editingId === option.id) {
            this.closeModal();
          }

          this.loadAdmissionOptions();
        } else {
          this.showToast(response.message || 'Unable to archive admission option.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.isArchivingId = null;
        this.showToast('Unable to archive admission option.', 'error');
        this.cdr.detectChanges();
        console.error('Archive admission option error:', error);
      },
    });
  }

  activateAdmissionOption(option: AdmissionOption): void {
    const confirmed = window.confirm(
      `Are you sure you want to activate/restore "${option.board_name}" option?`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.isArchivingId = option.id;
    this.cdr.detectChanges();

    this.admissionOptionsService.activateAdmissionOption(option).subscribe({
      next: (response) => {
        this.isArchivingId = null;

        if (response.success) {
          const msg = response.message || 'Admission option activated successfully.';
          this.showToast(msg, 'success');

          if (this.editingId === option.id) {
            this.closeModal();
          }

          this.loadAdmissionOptions();
        } else {
          this.showToast(response.message || 'Unable to activate admission option.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.isArchivingId = null;
        this.showToast('Unable to activate admission option.', 'error');
        this.cdr.detectChanges();
        console.error('Activate admission option error:', error);
      },
    });
  }
}