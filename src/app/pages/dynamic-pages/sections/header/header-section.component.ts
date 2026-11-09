import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  inject,
} from '@angular/core';
import { MediaService } from '../../../../services/media.service';
import { normalizeImageUrl } from '../../models/dynamic-page.model';

export interface LogoConfig {
  id: number;
  name: string;
  imageUrl: string;
  mediaId?: number | null;
  desktopActive: boolean;
  mobileActive: boolean;
}

@Component({
  selector: 'app-header-section',
  standalone: true,
  templateUrl: './header-section.component.html',
})
export class HeaderSectionComponent implements OnInit, OnChanges {
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() logos: LogoConfig[] = [];

  @Input() uploadMedia?: (
    file: File,
    onSuccess: (mediaId: number, url: string) => void
  ) => void;

  @Output() logosChange = new EventEmitter<LogoConfig[]>();

  isDragging = false;
  uploadingLogoId: number | null = null;
  deletingMediaId: number | null = null;
  copiedUrl: string | null = null;
  uploadError: string | null = null;

  ngOnInit(): void {
    this.hydrateMissingImages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logos']) {
      this.hydrateMissingImages();
    }
  }

  /**
   * If a logo was received with a mediaId but empty imageUrl, attempt to fetch the URL
   */
  private hydrateMissingImages(): void {
    if (!Array.isArray(this.logos)) return;

    this.logos.forEach((logo) => {
      if (logo.mediaId && !logo.imageUrl) {
        this.fetchMediaUrl(logo);
      }
    });
  }

  private fetchMediaUrl(logo: LogoConfig): void {
    if (!logo.mediaId) return;

    this.mediaService.getMediaById(logo.mediaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data as Record<string, unknown>;
          const rawUrl = String(
            d['public_url'] ??
            d['url'] ??
            d['file_url'] ??
            d['path'] ??
            d['relative_path'] ??
            (d['media'] as Record<string, unknown>)?.['url'] ??
            (d['media'] as Record<string, unknown>)?.['public_url'] ??
            ''
          ).trim();

          if (rawUrl) {
            logo.imageUrl = normalizeImageUrl(rawUrl);
            this.emitLogosChange();
            this.cdr.markForCheck();
          }
        }
      },
      error: () => {
        // Silent fallback if media lookup fails
      },
    });
  }

  addLogo(): void {
    const nextId =
      this.logos.length > 0
        ? Math.max(...this.logos.map((logo) => logo.id)) + 1
        : 1;

    this.logos = [
      ...this.logos,
      {
        id: nextId,
        name: `Logo ${nextId}`,
        imageUrl: '',
        mediaId: null,
        desktopActive: true,
        mobileActive: true,
      },
    ];

    this.emitLogosChange();
  }

  removeLogo(id: number): void {
    this.logos = this.logos.filter((logo) => logo.id !== id);
    this.emitLogosChange();
  }

  deleteMediaImage(logo: LogoConfig): void {
    if (
      logo.mediaId == null ||
      !Number.isInteger(Number(logo.mediaId)) ||
      Number(logo.mediaId) <= 0
    ) {
      this.removeLogo(logo.id);
      return;
    }

    const mediaId = Number(logo.mediaId);
    this.deletingMediaId = mediaId;

    this.mediaService.deleteMedia(mediaId).subscribe({
      next: () => {
        this.deletingMediaId = null;
        this.removeLogo(logo.id);
      },
      error: () => {
        this.deletingMediaId = null;
        // Still remove from page configuration
        this.removeLogo(logo.id);
      },
    });
  }

  updateLogoName(logo: LogoConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    logo.name = input.value;
    this.emitLogosChange();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, logo: LogoConfig): void {
    event.preventDefault();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    this.processImage(file, logo);
  }

  onFileSelected(event: Event, logo: LogoConfig): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.processImage(file, logo);
    input.value = '';
  }

  processImage(file: File, logo: LogoConfig): void {
    this.uploadError = null;

    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Please select a valid image file (PNG, JPG, SVG, WEBP).';
      return;
    }

    const reader = new FileReader();

    reader.onload = (): void => {
      const localResult = reader.result;
      if (typeof localResult !== 'string') {
        return;
      }

      this.uploadingLogoId = logo.id;

      const handleSuccess = (mediaId: number, url: string): void => {
        this.uploadingLogoId = null;
        logo.mediaId = mediaId;
        logo.imageUrl = normalizeImageUrl(url) || localResult;
        this.emitLogosChange();
      };

      if (this.uploadMedia) {
        this.uploadMedia(file, handleSuccess);
      } else {
        // Direct fallback using injected MediaService
        this.mediaService.uploadMedia(file).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              const d = res.data;
              const mediaId = Number(d.media_id ?? d.id);
              const imageUrl = String(
                d.public_url ??
                d.url ??
                d['file_url'] ??
                d.relative_path ??
                d.path ??
                ''
              );
              handleSuccess(mediaId, imageUrl);
            } else {
              this.uploadingLogoId = null;
              logo.imageUrl = localResult;
              this.emitLogosChange();
            }
          },
          error: () => {
            this.uploadingLogoId = null;
            // Keep local base64 preview so user work is not lost
            logo.imageUrl = localResult;
            this.emitLogosChange();
          },
        });
      }
    };

    reader.readAsDataURL(file);
  }

  removeImage(logo: LogoConfig): void {
    logo.imageUrl = '';
    logo.mediaId = null;
    this.emitLogosChange();
  }

  toggleDesktop(logo: LogoConfig): void {
    logo.desktopActive = !logo.desktopActive;
    this.emitLogosChange();
  }

  toggleMobile(logo: LogoConfig): void {
    logo.mobileActive = !logo.mobileActive;
    this.emitLogosChange();
  }

  copyImageUrl(url: string): void {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      this.copiedUrl = url;
      setTimeout(() => {
        if (this.copiedUrl === url) this.copiedUrl = null;
      }, 2000);
    });
  }

  emitLogosChange(): void {
    this.logosChange.emit([...this.logos]);
  }
}
