"""
Integration tests covering the core behaviour of the API.

Run with:
    python manage.py test apps.tests --verbosity=2

Uses Django's built-in TestCase (SQLite in-memory for speed).
No external services needed.
"""

from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User, Role
from apps.records.models import FinancialRecord, RecordType


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_user(email, role, password="pass1234"):
    u = User.objects.create_user(email=email, password=password, name=email.split("@")[0], role=role)
    return u


def get_tokens(client, email, password="pass1234"):
    resp = client.post(reverse("token_obtain"), {"email": email, "password": password}, format="json")
    return resp.data.get("access")


def auth_client(user):
    client = APIClient()
    token = get_tokens(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


# ─── User Management ──────────────────────────────────────────────────────────

class UserManagementTests(TestCase):
    def setUp(self):
        self.admin   = make_user("admin@t.com", Role.ADMIN)
        self.viewer  = make_user("viewer@t.com", Role.VIEWER)
        self.ac = auth_client(self.admin)
        self.vc = auth_client(self.viewer)

    def test_admin_can_list_users(self):
        r = self.ac.get(reverse("user-list-create"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_list_users(self):
        r = self.vc.get(reverse("user-list-create"))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_user(self):
        r = self.ac.post(reverse("user-list-create"), {
            "email": "new@t.com", "name": "New", "role": "viewer", "password": "newpass99"
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_viewer_cannot_create_user(self):
        r = self.vc.post(reverse("user-list-create"), {
            "email": "x@t.com", "name": "X", "role": "viewer", "password": "pass1234"
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_endpoint_returns_own_profile(self):
        r = self.vc.get(reverse("user-me"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["email"], "viewer@t.com")

    def test_soft_delete_deactivates_user(self):
        target = make_user("todel@t.com", Role.VIEWER)
        r = self.ac.delete(reverse("user-detail", args=[target.pk]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        target.refresh_from_db()
        self.assertFalse(target.is_active)

    def test_admin_cannot_soft_delete_self(self):
        r = self.ac.delete(reverse("user-detail", args=[self.admin.pk]))
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


# ─── Financial Records ────────────────────────────────────────────────────────

class RecordTests(TestCase):
    def setUp(self):
        self.admin   = make_user("admin@t.com",   Role.ADMIN)
        self.analyst = make_user("analyst@t.com", Role.ANALYST)
        self.viewer  = make_user("viewer@t.com",  Role.VIEWER)
        self.ac = auth_client(self.admin)
        self.nc = auth_client(self.analyst)
        self.vc = auth_client(self.viewer)

        self.record = FinancialRecord.objects.create(
            amount=Decimal("500.00"), type=RecordType.INCOME,
            category="Salary", date="2024-03-01", created_by=self.admin,
        )

    def test_all_roles_can_list_records(self):
        for client in [self.ac, self.nc, self.vc]:
            r = client.get(reverse("record-list-create"))
            self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_create_record(self):
        r = self.ac.post(reverse("record-list-create"), {
            "amount": "200.00", "type": "expense",
            "category": "Utilities", "date": "2024-03-15",
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_viewer_cannot_create_record(self):
        r = self.vc.post(reverse("record-list-create"), {
            "amount": "100.00", "type": "income",
            "category": "Bonus", "date": "2024-03-20",
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_analyst_cannot_create_record(self):
        r = self.nc.post(reverse("record-list-create"), {
            "amount": "100.00", "type": "income",
            "category": "Bonus", "date": "2024-03-20",
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_soft_delete_hides_record(self):
        r = self.ac.delete(reverse("record-detail", args=[self.record.pk]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.record.refresh_from_db()
        self.assertTrue(self.record.is_deleted)
        # Should no longer appear in listing
        list_r = self.ac.get(reverse("record-list-create"))
        ids = [item["id"] for item in list_r.data["results"]]
        self.assertNotIn(self.record.pk, ids)

    def test_filter_by_type(self):
        FinancialRecord.objects.create(
            amount=Decimal("300.00"), type=RecordType.EXPENSE,
            category="Rent", date="2024-03-10", created_by=self.admin,
        )
        r = self.ac.get(reverse("record-list-create") + "?type=expense")
        for item in r.data["results"]:
            self.assertEqual(item["type"], "expense")

    def test_negative_amount_rejected(self):
        r = self.ac.post(reverse("record-list-create"), {
            "amount": "-50.00", "type": "income",
            "category": "Misc", "date": "2024-03-01",
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardTests(TestCase):
    def setUp(self):
        self.admin   = make_user("admin@t.com",   Role.ADMIN)
        self.analyst = make_user("analyst@t.com", Role.ANALYST)
        self.viewer  = make_user("viewer@t.com",  Role.VIEWER)
        self.ac = auth_client(self.admin)
        self.nc = auth_client(self.analyst)
        self.vc = auth_client(self.viewer)

        FinancialRecord.objects.create(
            amount=Decimal("1000.00"), type=RecordType.INCOME,
            category="Salary", date="2024-03-01", created_by=self.admin,
        )
        FinancialRecord.objects.create(
            amount=Decimal("400.00"), type=RecordType.EXPENSE,
            category="Rent", date="2024-03-05", created_by=self.admin,
        )

    def test_summary_all_roles(self):
        for client in [self.ac, self.nc, self.vc]:
            r = client.get(reverse("dashboard-summary"))
            self.assertEqual(r.status_code, status.HTTP_200_OK)
            self.assertIn("net_balance", r.data)

    def test_summary_values_correct(self):
        r = self.ac.get(reverse("dashboard-summary"))
        self.assertEqual(Decimal(str(r.data["total_income"])),   Decimal("1000.00"))
        self.assertEqual(Decimal(str(r.data["total_expenses"])), Decimal("400.00"))
        self.assertEqual(Decimal(str(r.data["net_balance"])),    Decimal("600.00"))

    def test_categories_analyst_allowed(self):
        r = self.nc.get(reverse("dashboard-categories"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_categories_viewer_forbidden(self):
        r = self.vc.get(reverse("dashboard-categories"))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_monthly_trend_viewer_forbidden(self):
        r = self.vc.get(reverse("dashboard-monthly"))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_monthly_trend_analyst_allowed(self):
        r = self.nc.get(reverse("dashboard-monthly"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIsInstance(r.data, list)

    def test_recent_activity_all_roles(self):
        for client in [self.ac, self.nc, self.vc]:
            r = client.get(reverse("dashboard-recent"))
            self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_unauthenticated_request_rejected(self):
        anon = APIClient()
        r = anon.get(reverse("dashboard-summary"))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
