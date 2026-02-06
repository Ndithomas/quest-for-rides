import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
  pure: true
})
export class DateFormatPipe implements PipeTransform {
  transform(
    dateString: string | null | undefined,
    locale: string = 'en-US',
    options?: Intl.DateTimeFormatOptions
  ): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
      };
      
      return date.toLocaleDateString(locale, defaultOptions);
    } catch {
      return 'Invalid date';
    }
  }
}


@Pipe({
  name: 'dateTime',
  standalone: true,
  pure: true
})
export class DateTimePipe implements PipeTransform {
  transform(dateString: string | null | undefined, locale: string = 'en-US'): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }
}

