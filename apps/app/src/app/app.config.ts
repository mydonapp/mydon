import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  LUCIDE_ICONS, LucideIconProvider,
  LayoutDashboard, Wallet, CircleDollarSign, Settings2, FileText, Settings,
  LogOut, Eye, EyeOff, Menu, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, FileUp, CreditCard, Building,
  Upload, Bot, ArrowLeftRight, ArrowRight, Trash2, Download, ArrowLeft, RefreshCw,
  Plus, Check, X, Pencil, Pause, Play, Search, AlignJustify, LayoutList, Tag,
} from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({ defaultLanguage: 'en' }),
    ...provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.init();
    }),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutDashboard, Wallet, CircleDollarSign, Settings2, FileText, Settings,
        LogOut, Eye, EyeOff, Search, Menu, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, FileUp, CreditCard, Building,
        Upload, Bot, ArrowLeftRight, ArrowRight, Trash2, Download, ArrowLeft, RefreshCw,
        Plus, Check, X, Pencil, Pause, Play, AlignJustify, LayoutList, Tag,
      }),
    },
  ],
};
