import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatHttpService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  getMessages(groupId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/groups/${groupId}/messages`);
  }

  sendMessage(groupId: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/groups/${groupId}/messages`, { content });
  }
}
