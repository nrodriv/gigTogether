export interface User {
  id: string;
  email: string;
  alias: string;
  bio?: string;
  profilePicture?: string;
  currentSong?: string;
  musicGenres?: string[];
  role: 'USER' | 'ADMIN';
}

export interface City { id: string; name: string; slug: string; }

export interface Venue {
  id: string; name: string; address: string;
  city: City;
  meetingPoints?: MeetingPoint[];
}

export interface MeetingPoint { id: string; name: string; description?: string; }

export interface Concert {
  id: string; title: string; artistName: string; genre?: string;
  date: string; doorsOpenTime: string; imageUrl?: string;
  isPublished: boolean;
  venue: Venue;
  soloCount?: number;
  myGroup?: Group | null;
  isBanned?: boolean;
  isPast?: boolean;
}

export type NotificationType = 'EXPULSION' | 'GROUP_MESSAGE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  data?: { concertId?: string; artistName?: string; venueName?: string; groupId?: string; concertName?: string; senderAlias?: string };
  isRead: boolean;
  createdAt: string;
}

export type ArrivalWindow = 'EARLY' | 'ON_TIME' | 'LATE';
export type ActivityType  = 'HAVE_DRINK' | 'GET_GOOD_SPOT' | 'CHAT' | 'NO_PREFERENCE';
export type GroupStatus   = 'OPEN' | 'FULL' | 'CLOSED';

export interface Group {
  id: string; concertId: string;
  meetingPointId: string;
  arrivalWindow: ArrivalWindow;
  activityType: ActivityType;
  status: GroupStatus;
  chatUnlocked: boolean;
  members: GroupMember[];
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    userId: string;
    alias: string;
    profilePicture: string | null;
    isActive: boolean;
  };
}

export interface ChatNotification {
  groupId: string;
  senderAlias: string;
  concertName: string;
  message: string;
  createdAt: string;
}

export interface GroupMember {
  id: string; userId: string; alias: string;
  isOwner: boolean; activityType?: ActivityType;
  profilePicture?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}
