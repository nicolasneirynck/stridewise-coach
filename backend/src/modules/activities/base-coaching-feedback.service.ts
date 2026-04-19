import { Injectable } from '@nestjs/common';
import type {
  CoachingFeedbackDTO,
  CoachingFeedbackSeverity,
  ComponentRatingDTO,
  ComponentRatingValue,
  IntensityDistributionDTO,
  LongestRunProgressionDTO,
  WeeklyRunningProgressionDTO,
} from './activities.dto';

const INTENSITY_DISTRIBUTION_COMPONENT = 'intensity_distribution';
const WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT =
  'weekly_running_volume_progression';
const LONGEST_RUN_PROGRESSION_COMPONENT = 'longest_run_progression';
const MAX_LONGEST_RUN_INCREASE_PERCENTAGE = 10;
const MAX_LONGEST_RUN_INCREASE_FACTOR =
  1 + MAX_LONGEST_RUN_INCREASE_PERCENTAGE / 100;

const MAX_FEEDBACK_MESSAGES = 3;

const FEEDBACK_PRIORITY_BY_SEVERITY: Record<CoachingFeedbackSeverity, number> =
  {
    critical: 0,
    warning: 1,
    info: 2,
  };

type CoachingFeedbackMetrics = {
  intensityDistributions?: IntensityDistributionDTO[];
  weeklyRunningProgressions?: WeeklyRunningProgressionDTO[];
  longestRunProgressions?: LongestRunProgressionDTO[];
};

const FEEDBACK_SEVERITY_BY_RATING: Record<
  ComponentRatingValue,
  CoachingFeedbackSeverity
> = {
  Good: 'info',
  Caution: 'warning',
  'Needs attention': 'critical',
};

@Injectable()
export class BaseCoachingFeedbackService {
  generateFeedback(
    componentRatings: ComponentRatingDTO[],
    metrics: CoachingFeedbackMetrics = {},
  ): CoachingFeedbackDTO[] {
    const feedback = componentRatings
      .map((componentRating) => this.toFeedback(componentRating, metrics))
      .filter((feedback): feedback is CoachingFeedbackDTO => feedback !== null);

    return this.prioritizeFeedback(feedback).slice(0, MAX_FEEDBACK_MESSAGES);
  }

  private toFeedback(
    componentRating: ComponentRatingDTO,
    metrics: CoachingFeedbackMetrics,
  ): CoachingFeedbackDTO | null {
    if (componentRating.componentName === INTENSITY_DISTRIBUTION_COMPONENT) {
      return this.toIntensityDistributionFeedback(
        componentRating,
        metrics.intensityDistributions,
      );
    }

    if (
      componentRating.componentName ===
      WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT
    ) {
      return this.toWeeklyRunningVolumeProgressionFeedback(
        componentRating,
        metrics.weeklyRunningProgressions,
      );
    }

    if (componentRating.componentName === LONGEST_RUN_PROGRESSION_COMPONENT) {
      return this.toLongestRunProgressionFeedback(
        componentRating,
        metrics.longestRunProgressions,
      );
    }

    if (componentRating.reason === null) {
      return null;
    }

    return {
      componentName: componentRating.componentName,
      message: componentRating.reason,
      severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
    };
  }

  private prioritizeFeedback(
    feedback: CoachingFeedbackDTO[],
  ): CoachingFeedbackDTO[] {
    return [...feedback].sort(
      (firstFeedback, secondFeedback) =>
        this.getFeedbackPriority(firstFeedback) -
        this.getFeedbackPriority(secondFeedback),
    );
  }

  private getFeedbackPriority(feedback: CoachingFeedbackDTO): number {
    if (feedback.severity === null) {
      return Number.MAX_SAFE_INTEGER;
    }

    return FEEDBACK_PRIORITY_BY_SEVERITY[feedback.severity];
  }

  private toIntensityDistributionFeedback(
    componentRating: ComponentRatingDTO,
    intensityDistributions?: IntensityDistributionDTO[],
  ): CoachingFeedbackDTO {
    const latestIntensityDistribution =
      intensityDistributions?.[intensityDistributions.length - 1];

    if (
      !latestIntensityDistribution ||
      latestIntensityDistribution.totalCount === 0
    ) {
      return {
        componentName: componentRating.componentName,
        message:
          'Not enough heart rate data to evaluate intensity distribution.',
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    const lowIntensityPercentage = Math.round(
      latestIntensityDistribution.lowIntensityPercentage,
    );

    if (componentRating.rating === 'Good') {
      return {
        componentName: componentRating.componentName,
        message: `${lowIntensityPercentage}% of your runs were low intensity. Keep the easy work easy.`,
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    if (componentRating.rating === 'Caution') {
      return {
        componentName: componentRating.componentName,
        message: `${lowIntensityPercentage}% of your runs were low intensity. Aim for more easy running before adding harder sessions.`,
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    return {
      componentName: componentRating.componentName,
      message: `${lowIntensityPercentage}% of your runs were low intensity. Shift more weekly running into easy intensity.`,
      severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
    };
  }

  private toWeeklyRunningVolumeProgressionFeedback(
    componentRating: ComponentRatingDTO,
    weeklyRunningProgressions?: WeeklyRunningProgressionDTO[],
  ): CoachingFeedbackDTO {
    const latestProgression =
      weeklyRunningProgressions?.[weeklyRunningProgressions.length - 1];

    if (!latestProgression || latestProgression.percentageDifference === null) {
      return {
        componentName: componentRating.componentName,
        message: 'Not enough weekly running history to evaluate progression.',
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    const percentageDifference = Math.round(
      Math.abs(latestProgression.percentageDifference),
    );

    if (latestProgression.percentageDifference > 0) {
      const message =
        componentRating.rating === 'Good'
          ? `Weekly running volume increased by ${percentageDifference}% and stayed within a manageable range.`
          : `Weekly running volume increased by ${percentageDifference}%. Keep increases gradual so your body can adapt.`;

      return {
        componentName: componentRating.componentName,
        message,
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    if (latestProgression.percentageDifference < 0) {
      const message =
        componentRating.rating === 'Good'
          ? `Weekly running volume decreased by ${percentageDifference}% and stayed within a manageable range.`
          : `Weekly running volume decreased by ${percentageDifference}%. Watch for sudden drops if you are building consistency.`;

      return {
        componentName: componentRating.componentName,
        message,
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    return {
      componentName: componentRating.componentName,
      message:
        'Weekly running volume stayed stable compared with the previous week.',
      severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
    };
  }

  private toLongestRunProgressionFeedback(
    componentRating: ComponentRatingDTO,
    longestRunProgressions?: LongestRunProgressionDTO[],
  ): CoachingFeedbackDTO {
    const latestProgression =
      longestRunProgressions?.[longestRunProgressions.length - 1];

    if (
      !latestProgression ||
      !latestProgression.hasSufficientHistory ||
      latestProgression.previousFourWeekLongestRunBaseline === null ||
      latestProgression.percentageDifference === null
    ) {
      return {
        componentName: componentRating.componentName,
        message: 'Not enough longest run history to evaluate progression.',
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    const currentLongestRun = this.formatDistanceInKilometers(
      latestProgression.currentWeekLongestRunDistance,
    );
    const baselineLongestRunDistance =
      latestProgression.previousFourWeekLongestRunBaseline;
    const baselineLongestRun = this.formatDistanceInKilometers(
      baselineLongestRunDistance,
    );
    const maxRecommendedLongestRun = this.formatDistanceInKilometers(
      baselineLongestRunDistance * MAX_LONGEST_RUN_INCREASE_FACTOR,
    );
    const percentageDifference = Math.round(
      Math.abs(latestProgression.percentageDifference),
    );

    if (componentRating.rating === 'Good') {
      return {
        componentName: componentRating.componentName,
        message: `Your longest run was ${currentLongestRun}. Based on your longest run in the last 4 weeks (${baselineLongestRun}), keeping it under ${maxRecommendedLongestRun} stays within the ${MAX_LONGEST_RUN_INCREASE_PERCENTAGE}% guideline.`,
        severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
      };
    }

    return {
      componentName: componentRating.componentName,
      message: `Your longest run was ${currentLongestRun}, ${percentageDifference}% above your longest run in the last 4 weeks (${baselineLongestRun}). Try to keep long run increases within ${MAX_LONGEST_RUN_INCREASE_PERCENTAGE}%, around ${maxRecommendedLongestRun} for now.`,
      severity: FEEDBACK_SEVERITY_BY_RATING[componentRating.rating],
    };
  }

  private formatDistanceInKilometers(distanceInMeters: number): string {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
}
