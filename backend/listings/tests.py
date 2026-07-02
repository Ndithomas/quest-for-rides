import importlib
import os
from pathlib import Path

from django.test import SimpleTestCase


class MediaStorageSettingsTest(SimpleTestCase):
    def test_gcs_storage_is_enabled_when_bucket_is_configured(self):
        previous_env = os.environ.copy()
        os.environ['GS_BUCKET_NAME'] = 'test-media-bucket'
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(Path(__file__).resolve().parents[1] / 'gcp-key.json')

        try:
            import backend.settings as settings_module
            settings_module = importlib.reload(settings_module)
            backend = settings_module.STORAGES['default']['BACKEND']
        finally:
            os.environ.clear()
            os.environ.update(previous_env)
            import backend.settings as settings_module
            importlib.reload(settings_module)

        self.assertIn('storages.backends.gcloud.GoogleCloudStorage', backend)
