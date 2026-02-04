import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, Payout, PaginatedResponse } from '../services/payment.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-payout-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './payout-management.component.html',
  styleUrls: ['./payout-management.component.scss']
})
export class PayoutManagementComponent implements OnInit {
  allPayouts: Payout[] = [];                 // accumulated from all pages
  filteredPayouts: Payout[] = [];
  
  loading = true;
  loadingMore = false;
  error = '';
  success = '';
  
  filterStatus = 'all';
  
  currentPage = 1;
  hasMore = false;
  pageSize = 20;

  selectedPayout: Payout | null = null;
  showActionModal = false;
  actionType: 'approve' | 'process' | 'reject' | null = null;
  rejectReason = '';
  processing = false;
  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayouts();
  }

  loadPayouts(reset: boolean = false): void {
    if (reset) {
      this.loading = true;
      this.allPayouts = [];
      this.currentPage = 1;
      this.hasMore = false;
      this.filteredPayouts = [];
    } else {
      this.loadingMore = true;
    }

    this.error = '';

    this.paymentService
      .getManagementPayouts(this.filterStatus, this.currentPage, this.pageSize)
      .subscribe({
        next: (response: PaginatedResponse<Payout>) => {
          const newPayouts = response.results || [];

          this.allPayouts = reset 
            ? newPayouts 
            : [...this.allPayouts, ...newPayouts];

          this.hasMore = !!response.next;

          this.applyFilters();

          this.loading = false;
          this.loadingMore = false;

          if (!reset) {
            this.currentPage++;
          }
        },
        error: (err) => {
          console.error('Error loading payouts:', err);
          this.error = 'Failed to load payouts';
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.loadingMore || this.loading) return;
    this.loadPayouts(false);
  }

  applyFilters(): void {
    if (this.filterStatus === 'all') {
      this.filteredPayouts = [...this.allPayouts];
    } else {
      this.filteredPayouts = this.allPayouts.filter(p => p.status === this.filterStatus);
    }
  }

  onFilterChange(): void {
    // When filter changes → reset and reload with new status
    this.loadPayouts(true);
  }

  openActionModal(payout: Payout, type: 'approve' | 'process' | 'reject'): void {
    this.selectedPayout = payout;
    this.actionType = type;
    this.rejectReason = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedPayout = null;
    this.actionType = null;
    this.success = '';
  }

  executeAction(): void {
    if (!this.selectedPayout || !this.actionType) return;

    this.processing = true;
    this.error = '';

    let apiCall;
    if (this.actionType === 'approve') {
      apiCall = this.paymentService.approvePayout(this.selectedPayout.id);
    } else if (this.actionType === 'process') {
      apiCall = this.paymentService.processPayout(this.selectedPayout.id);
    } else {
      apiCall = this.paymentService.rejectPayout(this.selectedPayout.id, this.rejectReason);
    }

    apiCall.subscribe({
      next: () => {
        this.success = `Payout ${this.actionType}ed successfully`;
        this.processing = false;
        this.closeActionModal();
        setTimeout(() => this.loadPayouts(), 1500);
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = error?.error?.detail || `Failed to ${this.actionType} payout`;
        this.processing = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge bg-warning text-dark';
      case 'approved': return 'badge bg-info';
      case 'processing': return 'badge bg-primary';
      case 'completed': return 'badge bg-success';
      case 'failed': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  canApprove(payout: Payout): boolean {
    return payout.status === 'pending';
  }

  canProcess(payout: Payout): boolean {
    return payout.status === 'approved';
  }

  canReject(payout: Payout): boolean {
    return ['pending', 'approved'].includes(payout.status);
  }
}
