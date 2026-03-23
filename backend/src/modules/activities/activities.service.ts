import { Injectable } from '@nestjs/common';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';

@Injectable()
export class ActivitiesService {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}
}
