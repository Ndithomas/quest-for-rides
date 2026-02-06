import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentAnalytics } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { CurrencyXAFPipe } from '../shared/pipes';

@Component({
  selector: 'app-platform-earnings',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CurrencyXAFPipe],
  templateUrl: './platform-earnings.component.html',
  styleUrls: ['./platform-earnings.component.scss']
})
export class PlatformEarningsComponent implements OnInit {
  loading = true;
  error = '';
  analytics: PaymentAnalytics | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.paymentService.getPaymentAnalytics().subscribe({
      next: (data: PaymentAnalytics) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = 'Failed to load platform earnings data';
        this.loading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    if (!this.analytics) return 'FCFA 0';
    const symbol = this.analytics.currency === 'XAF' ? 'FCFA' : '$';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}
