import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyXAF',
  standalone: true,
  pure: true
})
export class CurrencyXAFPipe implements PipeTransform {
  transform(amount: number | null | undefined, symbol: string = 'FCFA'): string {
    if (amount === undefined || amount === null) return '';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  }
}

@Pipe({
  name: 'currency',
  standalone: true,
  pure: true
})
export class CurrencyPipe implements PipeTransform {
  transform(
    amount: number | null | undefined,
    locale: string = 'en-CM',
    currency: string = 'XAF'
  ): string {
    if (amount === undefined || amount === null) return '';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

