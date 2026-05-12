import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../services/user.service';
import { LanguageService, AVAILABLE_LANGUAGES } from '../../services/language.service';
import { PrivacyService } from '../../services/privacy.service';
import { ExportService } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';
import { ListStyleService } from '../../services/list-style.service';
import { BtnDirective } from '../../shared/directives/btn.directive';
import { InputDirective } from '../../shared/directives/input.directive';
import { SelectDirective, SelectOption } from '../../shared/directives/select.directive';
import { FieldComponent } from '../../shared/components/field/field';
import { ToggleComponent } from '../../shared/components/toggle/toggle';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  imports: [
    FormsModule,
    TranslateModule,
    BtnDirective,
    InputDirective,
    SelectDirective,
    FieldComponent,
    ToggleComponent,
    IconComponent,
  ],
})
export class SettingsComponent implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly languageService = inject(LanguageService);
  protected readonly privacyService = inject(PrivacyService);
  protected readonly themeService = inject(ThemeService);
  protected readonly listStyleService = inject(ListStyleService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  name = signal('');
  email = signal('');
  savingProfile = signal(false);
  exporting = signal(false);

  themeOptions = [
    { value: 'light' as const, label: 'views.settings.sections.appearance.light' },
    { value: 'dark' as const, label: 'views.settings.sections.appearance.dark' },
    { value: 'system' as const, label: 'views.settings.sections.appearance.system' },
  ];

  listStyleOptions = [
    { value: 'normal' as const, label: 'views.settings.sections.appearance.listStyleNormal' },
    { value: 'compact' as const, label: 'views.settings.sections.appearance.listStyleCompact' },
  ];

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

  async onThemeChange(theme: 'light' | 'dark' | 'system') {
    this.themeService.setTheme(theme);
    await this.savePreference('theme', theme);
  }

  async onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
    await this.savePreference('language', language);
  }

  async onListStyleChange(style: 'normal' | 'compact') {
    this.listStyleService.set(style);
    await this.savePreference('listStyle', style);
  }

  private async savePreference(key: string, value: string) {
    try {
      await this.userService.updatePreferences({ [key]: value });
    } catch (err) {
      this.toastService.error('Failed to save preference.');
      console.error('savePreference failed', key, err);
    }
  }

  async onPrivacyToggle() {
    this.privacyService.toggle();
    try {
      await this.userService.updatePreferences({ privacyMode: this.privacyService.isPrivate() });
    } catch {
      // Local change already applied; backend sync failed silently
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
