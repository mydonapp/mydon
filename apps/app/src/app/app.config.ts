import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  AlignJustify,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Bot,
  Building,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  LayoutDashboard,
  LayoutList,
  LogOut,
  LUCIDE_ICONS,
  LucideIconProvider,
  Menu,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Settings2,
  Tag,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AppConfigService } from './services/app-config.service';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({ defaultLanguage: 'en' }),
    ...provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    provideAppInitializer(async () => {
      const appConfig = inject(AppConfigService);
      const authService = inject(AuthService);
      await appConfig.load();
      return authService.init();
    }),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutDashboard,
        Wallet,
        CircleDollarSign,
        Settings2,
        FileText,
        Settings,
        LogOut,
        Eye,
        EyeOff,
        Search,
        Menu,
        ChevronRight,
        ChevronLeft,
        ChevronUp,
        ChevronDown,
        FileUp,
        CreditCard,
        Building,
        Upload,
        Bot,
        ArrowDown,
        ArrowLeftRight,
        ArrowRight,
        Trash2,
        Download,
        ArrowLeft,
        RefreshCw,
        Plus,
        Check,
        X,
        Pencil,
        Pause,
        Play,
        AlignJustify,
        LayoutList,
        Tag,
      }),
    },
  ],
};
