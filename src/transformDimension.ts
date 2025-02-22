/**
 * Helper: Transforms dimensions to px
 */
export function transformDimension(value: string | undefined | number): string | undefined {
  if (value === undefined) {
    return value;
  }

  // Check if the value is numeric with isNaN, this supports string values as well
  // Check if the value, when parsed (since it can also be number), does not equal 0
  if (!isNaN(value as number) && parseFloat(value as string) !== 0) {
    return `${value}px`;
  }
  return `${value}`;
}
