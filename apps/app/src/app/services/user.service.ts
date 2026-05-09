import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  user = signal<User | null>(null);

  async fetchUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/v1/auth/me`),
      );
      this.user.set(user);
    } catch {
      this.user.set(null);
    }
  }

  async updateUser(name: string, email: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<User>(`${environment.apiUrl}/v1/auth/me`, {
        name,
        email,
      }),
    );
    this.user.set(updated);
  }
}
