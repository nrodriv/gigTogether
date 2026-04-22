import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AdminConcert {
  id: string;
  artistName: string;
  title: string;
  genre: string | null;
  date: string;
  doorsOpenTime: string;
  imageUrl: string | null;
  isPublished: boolean;
  venue: { id: string; name: string; city: { name: string } };
}

export interface AdminVenue {
  id: string;
  name: string;
  address: string;
  city: { id: string; name: string; slug: string };
  _count?: { concerts: number };
}

export interface AdminMeetingPoint {
  id: string;
  name: string;
  description: string | null;
  venueId: string;
}

export interface CreateMeetingPointDto {
  name: string;
  description?: string;
}

export interface AdminCity {
  id: string;
  name: string;
  slug: string;
  _count?: { venues: number };
}

export interface AdminReportGroup {
  id: string;
  concert: { artistName: string; venue: { name: string } };
}

export interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  isRead: boolean;
  createdAt: string;
  reporter: { alias: string };
  reported: { alias: string };
  group: AdminReportGroup | null;
}

export interface AdminBlock {
  id: string;
  createdAt: string;
  blocker: { id: string; alias: string };
  blocked: { id: string; alias: string };
  group: AdminReportGroup | null;
}

export interface AdminStats {
  totalConcerts: number;
  publishedConcerts: number;
  totalUsers: number;
  totalReports: number;
}

export interface CreateConcertDto {
  artistName: string;
  title: string;
  genre?: string;
  venueId: string;
  date: string;
  doorsOpenTime: string;
  imageUrl?: string;
  isPublished: boolean;
}

export interface CreateVenueDto {
  name: string;
  address: string;
  cityId: string;
}

export interface CreateCityDto {
  name: string;
  slug: string;
}

export interface AdminGroupMember {
  id: string;
  isOwner: boolean;
  joinedAt: string;
  status: string;
  user: { id: string; alias: string; profilePicture: string | null };
}

export interface AdminGroup {
  id: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  arrivalWindow: 'EARLY' | 'ON_TIME' | 'LATE';
  activityType: 'HAVE_DRINK' | 'GET_GOOD_SPOT' | 'CHAT' | 'NO_PREFERENCE';
  maxSize: number;
  createdAt: string;
  concert: {
    id: string;
    title: string;
    artistName: string;
    date: string;
    venue: { id: string; name: string; city: { id: string; name: string } };
  };
  meetingPoint: { id: string; name: string } | null;
  members: AdminGroupMember[];
}

export interface AdminUser {
  id: string;
  alias: string;
  email: string;
  profilePicture: string | null;
  musicGenres: string[];
  isActive: boolean;
  createdAt: string;
  _count: { groupMembers: number; reportsGiven: number; reportsReceived: number };
}

export interface AdminUserDetail {
  id: string;
  alias: string;
  email: string;
  bio: string | null;
  profilePicture: string | null;
  currentSong: string | null;
  musicGenres: string[];
  isActive: boolean;
  createdAt: string;
  preferences: {
    arrivalWindow: string;
    activityType: string;
    notes: string | null;
  } | null;
  groupMembers: Array<{
    id: string;
    isOwner: boolean;
    joinedAt: string;
    group: {
      id: string;
      status: string;
      arrivalWindow: string;
      activityType: string;
      maxSize: number;
      meetingPoint: { name: string } | null;
      _count: { members: number };
      concert: {
        title: string;
        artistName: string;
        date: string;
        venue: { name: string; city: { name: string } };
      };
    };
  }>;
  reportsGiven: Array<{
    id: string;
    reason: string;
    details: string | null;
    isRead: boolean;
    createdAt: string;
    reported: { alias: string };
    group: AdminReportGroup | null;
  }>;
  reportsReceived: Array<{
    id: string;
    reason: string;
    details: string | null;
    isRead: boolean;
    createdAt: string;
    reporter: { alias: string };
    group: AdminReportGroup | null;
  }>;
}

interface ConcertListResponse {
  data: AdminConcert[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/admin/stats`);
  }

  getConcerts(): Observable<AdminConcert[]> {
    const params = new HttpParams().set('limit', '200');
    return this.http
      .get<ConcertListResponse>(`${this.base}/admin/concerts`, { params })
      .pipe(map(res => res.data));
  }

  getConcertById(id: string): Observable<AdminConcert | undefined> {
    return this.http.get<AdminConcert>(`${this.base}/admin/concerts/${id}`);
  }

  createConcert(dto: CreateConcertDto): Observable<AdminConcert> {
    return this.http.post<AdminConcert>(`${this.base}/admin/concerts`, dto);
  }

  updateConcert(id: string, dto: Partial<CreateConcertDto>): Observable<AdminConcert> {
    return this.http.patch<AdminConcert>(`${this.base}/admin/concerts/${id}`, dto);
  }

  publishConcert(id: string): Observable<AdminConcert> {
    return this.http.patch<AdminConcert>(`${this.base}/admin/concerts/${id}/publish`, {});
  }

  unpublishConcert(id: string): Observable<AdminConcert> {
    return this.http.patch<AdminConcert>(`${this.base}/admin/concerts/${id}/unpublish`, {});
  }

  deleteConcert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/concerts/${id}`);
  }

  getVenues(): Observable<AdminVenue[]> {
    return this.http.get<AdminVenue[]>(`${this.base}/admin/venues`);
  }

  getVenuesByCity(cityId: string): Observable<AdminVenue[]> {
    return this.getVenues().pipe(
      map(venues => venues.filter(v => v.city.id === cityId))
    );
  }

  getCities(): Observable<AdminCity[]> {
    return this.http.get<AdminCity[]>(`${this.base}/admin/cities`);
  }

  createVenue(dto: CreateVenueDto): Observable<AdminVenue> {
    return this.http.post<AdminVenue>(`${this.base}/admin/venues`, dto);
  }

  updateVenue(id: string, dto: Partial<CreateVenueDto>): Observable<AdminVenue> {
    return this.http.patch<AdminVenue>(`${this.base}/admin/venues/${id}`, dto);
  }

  deleteVenue(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/venues/${id}`);
  }

  createCity(dto: CreateCityDto): Observable<AdminCity> {
    return this.http.post<AdminCity>(`${this.base}/admin/cities`, dto);
  }

  deleteCity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/cities/${id}`);
  }

  getMeetingPoints(venueId: string): Observable<AdminMeetingPoint[]> {
    return this.http.get<AdminMeetingPoint[]>(`${this.base}/admin/venues/${venueId}/meeting-points`);
  }

  createMeetingPoint(venueId: string, dto: CreateMeetingPointDto): Observable<AdminMeetingPoint> {
    return this.http.post<AdminMeetingPoint>(`${this.base}/admin/venues/${venueId}/meeting-points`, dto);
  }

  deleteMeetingPoint(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/meeting-points/${id}`);
  }

  getReports(reporter?: string, reported?: string): Observable<AdminReport[]> {
    let params = new HttpParams();
    if (reporter) params = params.set('reporter', reporter);
    if (reported) params = params.set('reported', reported);
    return this.http.get<AdminReport[]>(`${this.base}/admin/reports`, { params });
  }

  markReportAsRead(id: string): Observable<AdminReport> {
    return this.http.patch<AdminReport>(`${this.base}/admin/reports/${id}/read`, {});
  }

  markAllReportsAsRead(): Observable<{ count: number }> {
    return this.http.patch<{ count: number }>(`${this.base}/admin/reports/read-all`, {});
  }

  getBlocks(blocker?: string, blocked?: string): Observable<AdminBlock[]> {
    let params = new HttpParams();
    if (blocker) params = params.set('blocker', blocker);
    if (blocked) params = params.set('blocked', blocked);
    return this.http.get<AdminBlock[]>(`${this.base}/admin/reports/blocks`, { params });
  }

  getGroups(filters?: {
    concertId?: string;
    venueId?: string;
    cityId?: string;
    userId?: string;
    status?: string;
  }): Observable<AdminGroup[]> {
    let params = new HttpParams();
    if (filters?.concertId) params = params.set('concertId', filters.concertId);
    if (filters?.venueId) params = params.set('venueId', filters.venueId);
    if (filters?.cityId) params = params.set('cityId', filters.cityId);
    if (filters?.userId) params = params.set('userId', filters.userId);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<AdminGroup[]>(`${this.base}/admin/groups`, { params });
  }

  getGroupById(id: string): Observable<AdminGroup> {
    return this.http.get<AdminGroup>(`${this.base}/admin/groups/${id}`);
  }

  getUsers(filters?: { alias?: string; email?: string }): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (filters?.alias) params = params.set('alias', filters.alias);
    if (filters?.email) params = params.set('email', filters.email);
    return this.http.get<AdminUser[]>(`${this.base}/admin/users`, { params });
  }

  getUserById(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.base}/admin/users/${id}`);
  }
}
