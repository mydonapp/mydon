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
  selector: 'app-signup',
  imports: [FormsModule, RouterLink, TranslateModule, BtnDirective, InputDirective, FieldComponent],
  templateUrl: './signup.html',
  styleUrl: './auth.css',
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
