import { Module } from '@nestjs/common';
import { AdminCitiesController } from './controllers/admin-cities.controller';
import { AdminVenuesController } from './controllers/admin-venues.controller';
import { AdminMeetingPointsController } from './controllers/admin-meeting-points.controller';
import { AdminConcertsController } from './controllers/admin-concerts.controller';
import { AdminReportsController } from './controllers/admin-reports.controller';
import { AdminStatsController } from './controllers/admin-stats.controller';
import { AdminGroupsController } from './controllers/admin-groups.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminCitiesService } from './services/admin-cities.service';
import { AdminVenuesService } from './services/admin-venues.service';
import { AdminMeetingPointsService } from './services/admin-meeting-points.service';
import { AdminConcertsService } from './services/admin-concerts.service';
import { AdminReportsService } from './services/admin-reports.service';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminGroupsService } from './services/admin-groups.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  controllers: [
    AdminCitiesController,
    AdminVenuesController,
    AdminMeetingPointsController,
    AdminConcertsController,
    AdminReportsController,
    AdminStatsController,
    AdminGroupsController,
    AdminUsersController,
  ],
  providers: [
    AdminCitiesService,
    AdminVenuesService,
    AdminMeetingPointsService,
    AdminConcertsService,
    AdminReportsService,
    AdminStatsService,
    AdminGroupsService,
    AdminUsersService,
  ],
})
export class AdminModule {}
