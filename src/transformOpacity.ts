/**
 * Helper: Transforms opacity % to a decimal point number
 * @example
 * 50% -> 0.5
 */
export function transformOpacity(
    value: string | number | undefined,
  ): string | number | undefined {
    if (value === undefined) {
      return value;
    }
    if (`${value}`.endsWith('%')) {
      const percentValue = `${value}`.slice(0, -1);
      return parseFloat(percentValue) / 100;
    }
    return value;
  }
  