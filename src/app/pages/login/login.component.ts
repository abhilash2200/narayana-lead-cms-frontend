import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  rememberMe = true;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  infoMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // If the user already has a valid token, navigate directly to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(): void {
    this.infoMessage =
      'To reset administrator credentials, please contact your SuperAdmin or IT support team at support@wbnarayanaschools.in.';
    this.errorMessage = '';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.infoMessage = '';
  }

  login(): void {
    const trimmedEmail = this.email.trim();
    if (!trimmedEmail || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService
      .login(trimmedEmail, this.password, 'Leads CMS Admin')
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (!response.success || !response.data?.token) {
            this.errorMessage = response.message || 'Authentication failed. Please try again.';
            return;
          }

          // Persist token and user details to storage
          this.authService.saveAuth(response.data, this.rememberMe);

          // Fetch safe profile from /auth/me and update token last_used_at
          this.authService.loadProfile().subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.router.navigate(['/dashboard']);
            },
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Login error:', err);

          if (err.status === 401 || err.status === 422) {
            this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
          } else if (err.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check your network or server status.';
          } else {
            this.errorMessage = err.error?.message || 'An unexpected error occurred during login.';
          }
        },
      });
  }
}
