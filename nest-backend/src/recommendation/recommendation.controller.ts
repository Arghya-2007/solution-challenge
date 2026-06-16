import { Controller, Get } from '@nestjs/common';

@Controller('recommendation')
export class RecommendationController {
  @Get()
  getRecommendations() {
    return {
      recommendations: [
        {
          category: "pre-processing",
          method: "Reweighting",
          description: "Applies different weights to training examples based on their protected attribute value and true label to balance the data distribution.",
          impact_on_bias: "High Reduction",
          impact_on_accuracy: "Slight Decrease"
        },
        {
          category: "in-processing",
          method: "Exponentiated Gradient Reduction",
          description: "Retrains the model by enforcing fairness constraints (like Demographic Parity) directly during the optimization process.",
          impact_on_bias: "High Reduction",
          impact_on_accuracy: "Moderate Decrease"
        },
        {
          category: "post-processing",
          method: "Reject Option Classification",
          description: "Adjusts predictions close to the decision boundary for unprivileged groups to promote favorable outcomes, reducing disparate impact.",
          impact_on_bias: "Moderate Reduction",
          impact_on_accuracy: "Minimal Impact"
        },
        {
          category: "data",
          method: "SMOTE for Fairness",
          description: "Generates synthetic examples for the unprivileged minority class to balance the representation in the dataset without just duplicating data.",
          impact_on_bias: "Moderate Reduction",
          impact_on_accuracy: "Slight Increase"
        }
      ]
    };
  }
}
