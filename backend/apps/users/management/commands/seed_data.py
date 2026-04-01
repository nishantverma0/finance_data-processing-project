"""
Management command: seed_data

Creates demo users (one per role) and 30 sample financial records.

Usage:
    python manage.py seed_data
"""

import random
from decimal import Decimal
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from apps.users.models import User, Role
from apps.records.models import FinancialRecord, RecordType

DEMO_USERS = [
    {"email": "admin@finance.dev",   "name": "Alice Admin",   "role": Role.ADMIN,   "password": "Admin@1234"},
    {"email": "analyst@finance.dev", "name": "Bob Analyst",   "role": Role.ANALYST, "password": "Analyst@1234"},
    {"email": "viewer@finance.dev",  "name": "Carol Viewer",  "role": Role.VIEWER,  "password": "Viewer@1234"},
]

CATEGORIES = {
    RecordType.INCOME:  ["Salary", "Freelance", "Investment", "Bonus", "Rental Income"],
    RecordType.EXPENSE: ["Rent", "Utilities", "Groceries", "Transport", "Healthcare",
                         "Entertainment", "Insurance", "Subscriptions"],
}


class Command(BaseCommand):
    help = "Seed the database with demo users and financial records."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo users…")
        admin_user = None
        for u in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=u["email"],
                defaults={"name": u["name"], "role": u["role"]},
            )
            if created:
                user.set_password(u["password"])
                user.save()
                self.stdout.write(f"  Created  {u['role']:8} → {u['email']}  pw: {u['password']}")
            else:
                self.stdout.write(f"  Exists   {u['role']:8} → {u['email']}")
            if u["role"] == Role.ADMIN:
                admin_user = user

        self.stdout.write("\nSeeding 30 financial records…")
        today = date.today()
        for i in range(30):
            rtype    = random.choice([RecordType.INCOME, RecordType.EXPENSE])
            category = random.choice(CATEGORIES[rtype])
            record_date = today - timedelta(days=random.randint(0, 180))
            FinancialRecord.objects.create(
                amount     = Decimal(str(round(random.uniform(100, 10_000), 2))),
                type       = rtype,
                category   = category,
                date       = record_date,
                notes      = f"Demo entry #{i + 1} — {category}",
                created_by = admin_user,
            )

        self.stdout.write(self.style.SUCCESS("\nDone! Database seeded successfully."))
