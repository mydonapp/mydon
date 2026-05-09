import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../services/user.service';
import { LanguageService, AVAILABLE_LANGUAGES } from '../../services/language.service';
import { PrivacyService } from '../../services/privacy.service';
import { ExportService } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { BaseButtonComponent } from '../../shared/components/base-button/base-button';
import { BaseInputComponent } from '../../shared/components/base-input/base-input';
import { BaseSelectComponent, SelectOption } from '../../shared/components/base-select/base-select';
import { BaseToggleComponent } from '../../shared/components/base-toggle/base-toggle';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  imports: [
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    BaseButtonComponent,
    BaseInputComponent,
    BaseSelectComponent,
    BaseToggleComponent,
  ],
})
export class SettingsComponent implements OnInit {
  private userService = inject(UserService);
  languageService = inject(LanguageService);
  privacyService = inject(PrivacyService);
  private exportService = inject(ExportService);
  private toastService = inject(ToastService);

  name = signal('');
  email = signal('');
  savingProfile = signal(false);
  exporting = signal(false);

  languageOptions: SelectOption[] = Object.entries(AVAILABLE_LANGUAGES).map(
    ([code, label]) => ({ value: code, label }),
  );

  ngOnInit() {
    this.userService.fetchUser().then(() => {
      const user = this.userService.user();
      if (user) {
        this.name.set(user.name);
        this.email.set(user.email);
      }
    });
  }

  async saveProfile() {
    this.savingProfile.set(true);
    try {
      await this.userService.updateUser(this.name(), this.email());
      this.toastService.success('Profile updated.');
    } catch {
      this.toastService.error('Failed to update profile.');
    } finally {
      this.savingProfile.set(false);
    }
  }

  async exportData() {
    this.exporting.set(true);
    try {
      await this.exportService.exportData();
      this.toastService.success('Export downloaded successfully!');
    } catch {
      this.toastService.error('Failed to export data. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }
}
