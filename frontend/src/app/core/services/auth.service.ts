import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/auth`;

  login(email: string, password: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.base}/login`, { email, password });
  }

  register(alias: string, email: string, password: string): Observable<{ id: string; email: string; alias: string }> {
    return this.http.post<{ id: string; email: string; alias: string }>(`${this.base}/register`, { alias, email, password });
  }

  getProfile(token: string): Observable<User> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<User>(`${this.base}/profile`, { headers });
  }
}
