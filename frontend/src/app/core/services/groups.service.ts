import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ArrivalWindow, ActivityType, Concert, Group, GroupMember, GroupStatus } from '../models';

export interface GroupWithConcert extends Group {
  isPast?: boolean;
  concert: Pick<Concert, 'id' | 'title' | 'artistName' | 'imageUrl' | 'date' | 'doorsOpenTime'> & {
    venue: { name: string; address: string };
  };
}

export interface JoinConcertDto {
  meetingPointId: string;
  arrivalWindow: ArrivalWindow;
  activityType: ActivityType;
}

interface RawMember {
  id: string;
  userId: string;
  status: string;
  isOwner: boolean;
  activityType: ActivityType;
  joinedAt: string;
  user: { id: string; alias: string; profilePicture: string | null };
}

interface RawGroup {
  id: string;
  concertId: string;
  meetingPointId: string;
  arrivalWindow: ArrivalWindow;
  activityType: ActivityType;
  status: GroupStatus;
  chatUnlocked: boolean;
  members: RawMember[];
  concert?: any;
}

function mapMember(m: RawMember): GroupMember {
  return {
    id: m.id,
    userId: m.userId,
    alias: m.user?.alias ?? m.userId,
    isOwner: m.isOwner,
    profilePicture: m.user?.profilePicture ?? null,
    activityType: m.activityType,
  };
}

function mapGroup(raw: RawGroup): Group {
  return {
    id: raw.id,
    concertId: raw.concertId,
    meetingPointId: raw.meetingPointId,
    arrivalWindow: raw.arrivalWindow,
    activityType: raw.activityType,
    status: raw.status,
    chatUnlocked: raw.chatUnlocked ?? false,
    members: (raw.members ?? []).map(mapMember),
  };
}

function mapGroupWithConcert(raw: RawGroup & { isPast?: boolean }): GroupWithConcert {
  return {
    ...mapGroup(raw),
    isPast: raw.isPast ?? false,
    concert: raw.concert,
  };
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  getMyGroups(): Observable<GroupWithConcert[]> {
    return this.http
      .get<RawGroup[]>(`${this.base}/groups/mine`)
      .pipe(map(groups => groups.map(mapGroupWithConcert)));
  }

  joinConcert(
    concertId: string,
    dto: JoinConcertDto,
    concert: Pick<Concert, 'id' | 'title' | 'artistName' | 'imageUrl' | 'date' | 'doorsOpenTime'> & {
      venue: { name: string; address: string };
    }
  ): Observable<GroupWithConcert> {
    return this.http
      .post<RawGroup>(`${this.base}/concerts/${concertId}/solo`, dto)
      .pipe(map(raw => ({ ...mapGroup(raw), concert })));
  }

  leaveGroup(groupId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/groups/${groupId}/leave`);
  }

  getGroupById(groupId: string): Observable<Group> {
    return this.http
      .get<RawGroup>(`${this.base}/groups/${groupId}`)
      .pipe(map(mapGroup));
  }

  getMyGroup(concertId: string): Observable<Group | null> {
    return this.http
      .get<RawGroup>(`${this.base}/concerts/${concertId}/my-group`)
      .pipe(map(mapGroup));
  }
}
