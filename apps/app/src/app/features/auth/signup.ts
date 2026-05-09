import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BaseButtonComponent } from '../../shared/components/base-button/base-button';
import { BaseInputComponent } from '../../shared/components/base-input/base-input';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink, TranslateModule, BaseButtonComponent, BaseInputComponent],
  templateUrl: './signup.html',
})
export class SignupComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  loading = signal(false);

  async onSubmit() {
    if (!this.name() || !this.email() || !this.password()) return;
    this.loading.set(true);
    try {
      await this.authService.signup(this.name(), this.email(), this.password());
      this.router.navigate(['/app']);
    } catch {
      this.toastService.error('Signup failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
