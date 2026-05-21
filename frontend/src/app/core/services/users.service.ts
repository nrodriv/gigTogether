import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportUserDto {
  reason: string;
  details?: string;
  groupId?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  blockUser(userId: string, groupId?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/users/${userId}/block`, groupId ? { groupId } : {});
  }

  reportUser(userId: string, dto: ReportUserDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/users/${userId}/report`, dto);
  }
}
