import { Pipe, PipeTransform } from '@angular/core';

/**
 * Status badge class pipe
 * Usage: {{ status | statusClass }} or {{ status | statusClass:'payout' }}
 */
@Pipe({
  name: 'statusClass',
  standalone: true,
  pure: true
})
export class StatusClassPipe implements PipeTransform {
  transform(status: string | null | undefined, type: string = 'default'): string {
    if (!status) return 'badge bg-secondary';
    
    const s = status.toLowerCase();
    
    // Payout specific statuses
    if (type === 'payout') {
      if (s === 'pending') return 'badge bg-warning text-dark';
      if (s === 'approved') return 'badge bg-info';
      if (s === 'processing') return 'badge bg-primary';
      if (s === 'completed') return 'badge bg-success';
      if (s === 'failed') return 'badge bg-danger';
      return 'badge bg-secondary';
    }
    
    // Default statuses (payments, bookings)
    if (s.includes('complete')) return 'badge bg-success';
    if (s.includes('pend')) return 'badge bg-warning text-dark';
    if (s.includes('fail')) return 'badge bg-danger';
    if (s.includes('refund')) {
      if (s.includes('partial')) return 'badge bg-info';
      return 'badge bg-secondary';
    }
    if (s.includes('active')) return 'badge bg-primary';
    if (s.includes('cancel') || s.includes('reject')) return 'badge bg-danger';
    if (s.includes('verify') || s.includes('approve')) return 'badge bg-info';
    if (s.includes('available')) return 'badge bg-success';
    if (s.includes('booked')) return 'badge bg-primary';
    if (s.includes('inactive')) return 'badge bg-secondary';
    
    return 'badge bg-secondary';
  }
}

