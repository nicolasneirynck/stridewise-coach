import { Injectable } from '@nestjs/common';
import type {
  ComponentRatingDTO,
  IntensityDistributionDTO,
  LongestRunProgressionDTO,
  WeeklyRunningProgressionDTO,
} from './activities.dto';

const INTENSITY_DISTRIBUTION_COMPONENT = 'intensity_distribution';
const WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT =
  'weekly_running_volume_progression';
const LONGEST_RUN_PROGRESSION_COMPONENT = 'longest_run_progression';

const GOOD_LOW_INTENSITY_PERCENTAGE = 80;
const CAUTION_LOW_INTENSITY_PERCENTAGE = 70;

const CAUTION_WEEKLY_VOLUME_INCREASE_PERCENTAGE = 10;
const NEEDS_ATTENTION_WEEKLY_VOLUME_INCREASE_PERCENTAGE = 20;
const CAUTION_WEEKLY_VOLUME_DECREASE_PERCENTAGE = -10;
const NEEDS_ATTENTION_WEEKLY_VOLUME_DECREASE_PERCENTAGE = -50;

const CAUTION_LONGEST_RUN_INCREASE_PERCENTAGE = 10;
const NEEDS_ATTENTION_LONGEST_RUN_INCREASE_PERCENTAGE = 20;

@Injectable()
export class TrainingEvaluationService {
  evaluateIntensityDistribution(
    intensityDistributions: IntensityDistributionDTO[],
  ): ComponentRatingDTO {
    const latestIntensityDistribution =
      intensityDistributions[intensityDistributions.length - 1];

    if (
      !latestIntensityDistribution ||
      latestIntensityDistribution.totalCount === 0
    ) {
      return {
        componentName: INTENSITY_DISTRIBUTION_COMPONENT,
        rating: 'Caution',
        reason:
          'Not enough heart rate data to evaluate intensity distribution.',
      };
    }

    if (
      latestIntensityDistribution.lowIntensityPercentage >=
      GOOD_LOW_INTENSITY_PERCENTAGE
    ) {
      return {
        componentName: INTENSITY_DISTRIBUTION_COMPONENT,
        rating: 'Good',
        reason: null,
      };
    }

    if (
      latestIntensityDistribution.lowIntensityPercentage >=
      CAUTION_LOW_INTENSITY_PERCENTAGE
    ) {
      return {
        componentName: INTENSITY_DISTRIBUTION_COMPONENT,
        rating: 'Caution',
        reason: 'Low-intensity running is slightly below target.',
      };
    }

    return {
      componentName: INTENSITY_DISTRIBUTION_COMPONENT,
      rating: 'Needs attention',
      reason: 'Too much running is above Zone 2.',
    };
  }

  evaluateWeeklyRunningVolumeProgression(
    weeklyRunningProgressions: WeeklyRunningProgressionDTO[],
  ): ComponentRatingDTO {
    const latestProgression =
      weeklyRunningProgressions[weeklyRunningProgressions.length - 1];

    if (!latestProgression || latestProgression.percentageDifference === null) {
      return {
        componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
        rating: 'Caution',
        reason: 'Not enough weekly running history to evaluate progression.',
      };
    }

    if (
      latestProgression.percentageDifference >
      NEEDS_ATTENTION_WEEKLY_VOLUME_INCREASE_PERCENTAGE
    ) {
      return {
        componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
        rating: 'Needs attention',
        reason: 'Weekly running volume increased too sharply.',
      };
    }

    if (
      latestProgression.percentageDifference >
      CAUTION_WEEKLY_VOLUME_INCREASE_PERCENTAGE
    ) {
      return {
        componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
        rating: 'Caution',
        reason: 'Weekly running volume increased sharply.',
      };
    }

    if (
      latestProgression.percentageDifference <
      NEEDS_ATTENTION_WEEKLY_VOLUME_DECREASE_PERCENTAGE
    ) {
      return {
        componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
        rating: 'Needs attention',
        reason: 'Weekly running volume dropped sharply.',
      };
    }

    if (
      latestProgression.percentageDifference <
      CAUTION_WEEKLY_VOLUME_DECREASE_PERCENTAGE
    ) {
      return {
        componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
        rating: 'Caution',
        reason: 'Weekly running volume decreased noticeably.',
      };
    }

    return {
      componentName: WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT,
      rating: 'Good',
      reason: null,
    };
  }

  evaluateLongestRunProgression(
    longestRunProgressions: LongestRunProgressionDTO[],
  ): ComponentRatingDTO {
    const latestProgression =
      longestRunProgressions[longestRunProgressions.length - 1];

    if (
      !latestProgression ||
      !latestProgression.hasSufficientHistory ||
      latestProgression.percentageDifference === null
    ) {
      return {
        componentName: LONGEST_RUN_PROGRESSION_COMPONENT,
        rating: 'Caution',
        reason: 'Not enough longest run history to evaluate progression.',
      };
    }

    if (
      latestProgression.percentageDifference >
      NEEDS_ATTENTION_LONGEST_RUN_INCREASE_PERCENTAGE
    ) {
      return {
        componentName: LONGEST_RUN_PROGRESSION_COMPONENT,
        rating: 'Needs attention',
        reason: 'Longest run increased too sharply.',
      };
    }

    if (
      latestProgression.percentageDifference >
      CAUTION_LONGEST_RUN_INCREASE_PERCENTAGE
    ) {
      return {
        componentName: LONGEST_RUN_PROGRESSION_COMPONENT,
        rating: 'Caution',
        reason: 'Longest run increased sharply.',
      };
    }

    return {
      componentName: LONGEST_RUN_PROGRESSION_COMPONENT,
      rating: 'Good',
      reason: null,
    };
  }
}
