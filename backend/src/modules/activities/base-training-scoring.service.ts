import { Injectable } from '@nestjs/common';
import type {
  BaseTrainingScoreDTO,
  ComponentRatingDTO,
  ComponentRatingValue,
} from './activities.dto';

const RATING_SCORES: Record<ComponentRatingValue, number> = {
  Good: 100,
  Caution: 60,
  'Needs attention': 20,
};

const INTENSITY_DISTRIBUTION_COMPONENT = 'intensity_distribution';
const WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT =
  'weekly_running_volume_progression';
const LONGEST_RUN_PROGRESSION_COMPONENT = 'longest_run_progression';

const COMPONENT_WEIGHTS: Record<string, number> = {
  [INTENSITY_DISTRIBUTION_COMPONENT]: 0.4,
  [WEEKLY_RUNNING_VOLUME_PROGRESSION_COMPONENT]: 0.35,
  [LONGEST_RUN_PROGRESSION_COMPONENT]: 0.25,
};

@Injectable()
export class BaseTrainingScoringService {
  calculateBaseTrainingScore(
    componentRatings: ComponentRatingDTO[],
  ): BaseTrainingScoreDTO {
    const components = componentRatings.map((componentRating) => {
      const score = RATING_SCORES[componentRating.rating];
      const weight = COMPONENT_WEIGHTS[componentRating.componentName] ?? 0;
      const weightedScore = this.roundScore(score * weight);

      return {
        componentName: componentRating.componentName,
        rating: componentRating.rating,
        weight,
        score,
        weightedScore,
        reason: componentRating.reason,
      };
    });

    const weightedScoreTotal = components.reduce(
      (scoreTotal, component) => scoreTotal + component.weightedScore,
      0,
    );

    const usedWeightTotal = components.reduce(
      (weightTotal, component) => weightTotal + component.weight,
      0,
    );

    const totalScore =
      usedWeightTotal === 0 ? 0 : weightedScoreTotal / usedWeightTotal;

    return {
      totalScore: this.roundScore(totalScore),
      components,
      ratingScale: RATING_SCORES,
    };
  }

  private roundScore(score: number): number {
    return Math.round(score * 10) / 10;
  }
}
