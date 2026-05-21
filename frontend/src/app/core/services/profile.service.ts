import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models';

export interface PublicProfile {
  id: string;
  alias: string;
  bio?: string;
  profilePicture?: string;
  currentSong?: string;
  musicGenres?: string[];
}

export interface UpdatePublicProfileDto {
  bio?: string;
  profilePicture?: string;
  currentSong?: string;
  musicGenres?: string[];
}

export interface UpdateAccountDto {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/users`;

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  updatePublicProfile(dto: UpdatePublicProfileDto): Observable<Partial<User>> {
    return this.http.patch<Partial<User>>(`${this.base}/me/profile`, dto);
  }

  updateAccount(dto: UpdateAccountDto): Observable<Partial<User>> {
    return this.http.patch<Partial<User>>(`${this.base}/me/account`, dto);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/me`);
  }

  getPublicProfile(userId: string): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`${this.base}/${userId}/public`);
  }
}
