import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { MetaModule } from '../meta/meta.module';

@Module({
  imports: [MetaModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
