import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppConfigService } from '../../services/app-config.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { IconComponent } from '../../shared/components/icon/icon';
import { InputDirective } from '../../shared/directives/input.directive';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslateModule, BtnDirective, InputDirective, FieldComponent, IconComponent],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly appConfig = inject(AppConfigService);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  showApiSettings = signal(false);
  editApiUrl = signal('');

  toggleApiSettings() {
    if (!this.showApiSettings()) {
      this.editApiUrl.set(this.appConfig.customApiUrl() ?? '');
    }
    this.showApiSettings.update((v) => !v);
  }

  async saveApiUrl() {
    await this.appConfig.setCustomApiUrl(this.editApiUrl().trim() || null);
    this.showApiSettings.set(false);
  }

  async clearApiUrl() {
    await this.appConfig.setCustomApiUrl(null);
    this.editApiUrl.set('');
    this.showApiSettings.set(false);
  }

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
