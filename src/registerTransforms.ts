import { Core } from 'style-dictionary';
import { transformDimension } from './transformDimension.js';
import { transformHEXRGBaForCSS } from './css/transformHEXRGBa.js';
import { transformShadowForCSS } from './css/transformShadow.js';
import { transformFontWeights } from './transformFontWeights.js';
import { transformLetterSpacingForCSS } from './css/transformLetterSpacing.js';
import { transformLineHeight } from './transformLineHeight.js';
import { transformTypographyForCSS } from './css/transformTypography.js';
import { transformTypographyForCompose } from './compose/transformTypography.js';
import { transformBorderForCSS } from './css/transformBorder.js';
import { checkAndEvaluateMath } from './checkAndEvaluateMath.js';
import { mapDescriptionToComment } from './mapDescriptionToComment.js';
import { transformColorModifiers } from './color-modifiers/transformColorModifiers.js';

const isBrowser = typeof window === 'object';

/**
 * typecasting since this will need to work in browser environment, so we cannot
 * import style-dictionary as it depends on nodejs env
 */
export async function registerTransforms(sd: Core) {
  let _sd = sd;

  // NodeJS env and no passed SD? let's register on our installed SD
  // We're in ESM, but style-dictionary is CJS only, so we need module.createRequire
  if (!isBrowser && _sd === undefined) {
    const module = await import('module');
    const mod = module.default;
    const require = mod.createRequire(import.meta.url);
    _sd = require('style-dictionary');
  }

  _sd.registerTransform({
    name: 'ts/descriptionToComment',
    type: 'attribute',
    matcher: token => token.description,
    transformer: token => mapDescriptionToComment(token),
  });

  _sd.registerTransform({
    name: 'ts/size/px',
    type: 'value',
    matcher: token =>
      ['sizing', 'spacing', 'borderRadius', 'borderWidth', 'fontSizes', 'dimension'].includes(
        token.type,
      ),
    transformer: token => transformDimension(token.value),
  });

  _sd.registerTransform({
    name: 'ts/size/css/letterspacing',
    type: 'value',
    matcher: token => token.type === 'letterSpacing',
    transformer: token => transformLetterSpacingForCSS(token.value),
  });

  _sd.registerTransform({
    name: 'ts/size/lineheight',
    type: 'value',
    matcher: token => token.type === 'lineHeights',
    transformer: token => transformLineHeight(token.value),
  });

  _sd.registerTransform({
    name: 'ts/type/fontWeight',
    type: 'value',
    matcher: token => token.type === 'fontWeights',
    transformer: token => transformFontWeights(token.value),
  });

  /**
   * The transforms below are transitive transforms, because their values
   * can contain references, e.g.:
   * - rgba({color.r}, {color.g}, 0, 0)
   * - {dimension.scale} * {spacing.sm}
   * - { fontSize: "{foo}" }
   * - { width: "{bar}" }
   * - { blur: "{qux}" }
   * or because the modifications have to be done on this specific token,
   * after resolution, e.g. color modify
   */
  _sd.registerTransform({
    name: 'ts/resolveMath',
    type: 'value',
    transitive: true,
    matcher: token => typeof token.value === 'string',
    // Putting this in strings seems to be required
    transformer: token => `${checkAndEvaluateMath(token.value)}`,
  });

  _sd.registerTransform({
    name: 'ts/typography/css/shorthand',
    type: 'value',
    transitive: true,
    matcher: token => token.type === 'typography',
    transformer: token => transformTypographyForCSS(token.value),
  });

  _sd.registerTransform({
    name: 'ts/typography/compose/shorthand',
    type: 'value',
    transitive: true,
    matcher: token => token.type === 'typography',
    transformer: token => transformTypographyForCompose(token.value),
  });

  _sd.registerTransform({
    name: 'ts/border/css/shorthand',
    type: 'value',
    transitive: true,
    matcher: token => token.type === 'border',
    transformer: token => transformBorderForCSS(token.value),
  });

  _sd.registerTransform({
    name: 'ts/shadow/css/shorthand',
    type: 'value',
    transitive: true,
    matcher: token => ['boxShadow'].includes(token.type),
    transformer: token =>
      Array.isArray(token.value)
        ? token.value.map(single => transformShadowForCSS(single)).join(', ')
        : transformShadowForCSS(token.value),
  });

  _sd.registerTransform({
    name: 'ts/color/css/hexrgba',
    type: 'value',
    transitive: true,
    matcher: token => typeof token.value === 'string' && token.value.startsWith('rgba(#'),
    transformer: token => transformHEXRGBaForCSS(token.value),
  });

  _sd.registerTransform({
    name: 'ts/color/modifiers',
    type: 'value',
    transitive: true,
    matcher: token =>
      token.type === 'color' && token.$extensions && token.$extensions['studio.tokens']?.modify,
    transformer: token => transformColorModifiers(token),
  });

  _sd.registerTransformGroup({
    name: 'tokens-studio',
    transforms: [
      'ts/descriptionToComment',
      'ts/size/px',
      'ts/size/css/letterspacing',
      'ts/size/lineheight',
      'ts/type/fontWeight',
      'ts/resolveMath',
      'ts/typography/css/shorthand',
      'ts/border/css/shorthand',
      'ts/shadow/css/shorthand',
      'ts/color/css/hexrgba',
      'ts/color/modifiers',
      // by default we go with camel, as having no default will likely give the user
      // errors straight away. This can be overridden by manually passing an array of transforms
      // instead of this transformGroup, or by doing a name conversion in your custom format
      'name/cti/camel',
    ],
  });
}
