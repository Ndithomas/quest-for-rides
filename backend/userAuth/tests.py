from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTests(APITestCase):

    def setUp(self):
        # Base setup data used across multiple test cases
        self.register_url = '/api/auth/register/'  # Update matching your root urls.py prefix
        self.login_url = '/api/auth/login/'
        
        self.user_data = {
            'username': 'testrider',
            'email': 'rider@quest4rides.com',
            'password': 'SecurePassword123',
            'role': 'guest'
        }

    # Test Case 1: Registration Endpoint
    def test_registration_successful(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        
        # Assertions to verify correct behavior
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Registration successful')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['role'], 'guest')

    # Test Case 2: Validation Check (Missing Input)
    def test_registration_missing_fields(self):
        incomplete_data = {'username': 'broken'}
        response = self.client.post(self.register_url, incomplete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Missing required fields')

    # Test Case 3: Authentication Endpoint
    def test_login_successful(self):
        # Manually create a user in the test database first
        User.objects.create_user(
            username='testrider',
            email='rider@quest4rides.com',
            password='SecurePassword123',
            role='guest'
        )

        login_data = {
            'username': 'testrider',
            'password': 'SecurePassword123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Login successful')
        self.assertTrue(response.data['access'])

    # Test Case 4: Authentication Security Denial
    def test_login_invalid_credentials(self):
        bad_login_data = {
            'username': 'testrider',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, bad_login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Invalid credentials')