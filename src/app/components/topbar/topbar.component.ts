import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  @Input() title = 'Dashboard';
  @Input() subtitle = 'Overview';

  isProfileMenuOpen = false;
  isLoggingOut = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly sidebarService: SidebarService,
  ) {}

  toggleMobileSidebar(): void {
    this.sidebarService.toggle();
  }

  ngOnInit(): void {
    // Call on panel reload: fetches safe profile & updates token last_used_at
    this.authService.loadProfile().subscribe();
  }

  get currentUser(): AuthUser | null {
    return this.authService.currentUser() ?? this.authService.getUser();
  }

  get userName(): string {
    return this.currentUser?.name || 'Admin';
  }

  get userEmail(): string {
    return this.currentUser?.email || '';
  }

  get userRole(): string {
    return this.currentUser?.type || 'Administrator';
  }

  get userInitial(): string {
    return (this.userName[0] || 'A').toUpperCase();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.finishLogout();
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.finishLogout();
      },
    });
  }

  private finishLogout(): void {
    this.authService.clearSession();
    this.isProfileMenuOpen = false;
    this.isLoggingOut = false;
    this.router.navigate(['/']);
  }
}
