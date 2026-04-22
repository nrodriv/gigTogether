import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { City, Concert } from '../models';

interface ConcertListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ConcertsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  private mapConcert(raw: any): Concert {
    return {
      ...raw,
      soloCount: raw.acceptedMembersCount ?? raw.soloCount,
      venue: {
        ...raw.venue,
        meetingPoints: raw.venue?.meetingPoints ?? [],
      },
    };
  }

  getAll(cityId?: string, genre?: string, limit?: number): Observable<Concert[]> {
    let params = new HttpParams();
    if (cityId) params = params.set('cityId', cityId);
    if (genre) params = params.set('genre', genre);
    if (limit) params = params.set('limit', limit.toString());

    return this.http
      .get<ConcertListResponse>(`${this.base}/concerts`, { params })
      .pipe(map(res => res.data.map(c => this.mapConcert(c))));
  }

  getHomeConciertos(): Observable<Concert[]> {
    const params = new HttpParams().set('limit', '5');
    return this.http
      .get<ConcertListResponse>(`${this.base}/concerts`, { params })
      .pipe(map(res => res.data.map(c => this.mapConcert(c))));
  }

  getById(id: string): Observable<Concert> {
    return this.http
      .get<any>(`${this.base}/concerts/${id}`)
      .pipe(map(c => this.mapConcert(c)));
  }

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/cities`);
  }
}
