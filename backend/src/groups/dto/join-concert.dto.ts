import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ArrivalWindow, ActivityType } from '@prisma/client';

export class JoinConcertDto {
  @IsString()
  @IsNotEmpty()
  meetingPointId: string;

  @IsEnum(ArrivalWindow)
  arrivalWindow: ArrivalWindow;

  @IsEnum(ActivityType)
  activityType: ActivityType;
}
