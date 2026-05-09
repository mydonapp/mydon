import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { FieldComponent } from '../../shared/components/field/field';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslateModule, BtnDirective, InputDirective, FieldComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);

  async onSubmit() {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    try {
      await this.authService.login(this.email(), this.password());
      this.router.navigate(['/app']);
    } catch {
      this.toastService.error('Login failed. Check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
