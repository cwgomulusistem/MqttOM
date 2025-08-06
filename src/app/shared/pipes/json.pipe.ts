
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prettyJson',
})
export class PrettyJsonPipe implements PipeTransform {
  /**
   * Transforms a string into a formatted JSON string.
   * If the string is not a valid JSON, it returns the original string.
   * @param value The string to transform.
   * @returns A formatted JSON string or the original string.
   */
  transform(value: string): string {
    if (!value) {
      return '';
    }
    try {
      const jsonObject = JSON.parse(value);
      return JSON.stringify(jsonObject, null, 2); // 2 spaces for indentation
    } catch (e) {
      // If parsing fails, return the original string
      return value;
    }
  }
}
