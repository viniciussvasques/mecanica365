import { SetMetadata } from '@nestjs/common';
import { FeatureName } from '../feature-flags.service';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * Decorator para exigir que uma feature esteja habilitada
 * 
 * @example
 * @RequireFeature('elevators')
 * @Get()
 * async getElevators() { ... }
 */
export const RequireFeature = (feature: FeatureName) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);

