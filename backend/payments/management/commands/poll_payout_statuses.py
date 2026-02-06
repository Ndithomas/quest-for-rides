from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from payments.models import Payout
from payments.campay import get_transaction_status
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Poll CamPay for status updates on processing payouts and update records accordingly'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Maximum number of payouts to process (default: 50)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        limit = options['limit']
        verbosity = int(options.get('verbosity', 1))

        if verbosity >= 1:
            self.stdout.write(f"{'[DRY RUN] ' if dry_run else ''}Polling CamPay for payout statuses...")

        # Get payouts that are processing and have an external_reference
        processing_payouts = Payout.objects.filter(
            status='processing',
            external_reference__isnull=False
        ).exclude(
            external_reference=''
        ).order_by('-updated_at')[:limit]

        count = processing_payouts.count()
        if verbosity >= 1:
            self.stdout.write(f"Found {count} processing payouts to check")

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No processing payouts to update"))
            return

        updated = 0
        failed = 0
        unchanged = 0

        for payout in processing_payouts:
            if verbosity >= 2:
                self.stdout.write(f"Checking payout {payout.id} (ref: {payout.external_reference})")

            try:
                status_data = get_transaction_status(payout.external_reference)
                campay_status = (status_data.get('status') or status_data.get('result') or '').upper()

                if verbosity >= 3:
                    self.stdout.write(f"  Raw response: {status_data}")

                # Map CamPay statuses to our internal statuses
                new_status = None
                if campay_status in ('SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'DONE'):
                    new_status = 'completed'
                elif campay_status in ('FAILED', 'ERROR', 'REJECTED', 'CANCELLED'):
                    new_status = 'failed'

                if new_status and new_status != payout.status:
                    if dry_run:
                        self.stdout.write(
                            self.style.WARNING(
                                f"  [DRY RUN] Would update payout {payout.id}: {payout.status} -> {new_status}"
                            )
                        )
                    else:
                        with transaction.atomic():
                            old_status = payout.status
                            payout.status = new_status
                            if new_status == 'completed':
                                payout.completed_at = timezone.now()
                                payout.save(update_fields=['status', 'completed_at'])
                            else:
                                payout.notes = (payout.notes or '') + f"\nCamPay status: {campay_status}"
                                payout.save(update_fields=['status', 'notes'])

                            logger.info(
                                f"Payout {payout.id} updated: {old_status} -> {new_status} "
                                f"(external_ref: {payout.external_reference})"
                            )

                        if verbosity >= 1:
                            self.stdout.write(
                                self.style.SUCCESS(f"  Updated payout {payout.id}: {old_status} -> {new_status}")
                            )
                        updated += 1
                else:
                    if verbosity >= 2:
                        self.stdout.write(f"  No change for payout {payout.id} (status: {payout.status}, campay: {campay_status})")
                    unchanged += 1

            except Exception as e:
                failed += 1
                logger.error(f"Error checking payout {payout.id}: {e}")
                if verbosity >= 1:
                    self.stdout.write(
                        self.style.ERROR(f"  Error checking payout {payout.id}: {e}")
                    )

        # Summary
        if verbosity >= 1:
            self.stdout.write("")
            self.stdout.write(f"Summary: {updated} updated, {unchanged} unchanged, {failed} errors")
            if dry_run:
                self.stdout.write(self.style.WARNING("[DRY RUN] No actual changes made"))

