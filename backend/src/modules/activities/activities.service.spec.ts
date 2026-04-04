import { ActivitiesService } from './activities.service';
import type { DatabaseProvider } from '../../database/drizzle.provider';
import { StravaService } from '../strava/strava.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let db: Pick<DatabaseProvider, 'query'>;

  beforeEach(() => {
    db = {
      query: {
        activities: {
          findMany: jest.fn(),
        },
      },
    } as unknown as Pick<DatabaseProvider, 'query'>;

    service = new ActivitiesService(
      db as DatabaseProvider,
      {} as StravaService,
    );
  });

  describe('getWeeklyLoad', () => {
    it('returns empty data when the user has no runs', async () => {
      (
        db.query.activities.findMany as jest.MockedFunction<
          typeof db.query.activities.findMany
        >
      ).mockResolvedValue([]);

      await expect(service.getWeeklyLoad({ id: 42 } as never)).resolves.toEqual(
        [],
      );
    });

    it('fills missing weeks between the first and last run week', async () => {
      (
        db.query.activities.findMany as jest.MockedFunction<
          typeof db.query.activities.findMany
        >
      ).mockResolvedValue([
        {
          start_date: new Date('2026-01-07T10:00:00.000Z'),
          distance: 5000,
        },
        {
          start_date: new Date('2026-01-22T18:00:00.000Z'),
          distance: 7000,
        },
        {
          start_date: new Date('2026-01-24T08:00:00.000Z'),
          distance: 3000,
        },
      ]);

      await expect(service.getWeeklyLoad({ id: 42 } as never)).resolves.toEqual(
        [
          { weekStartDate: '2026-01-05', totalLoad: 5000 },
          { weekStartDate: '2026-01-12', totalLoad: 0 },
          { weekStartDate: '2026-01-19', totalLoad: 10000 },
        ],
      );
    });
  });
});
