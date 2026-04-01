"""
FinancialRecord model.

Fields
------
amount      – positive decimal (never negative; direction is given by type)
type        – "income" or "expense"
category    – free-text grouping label (e.g. "Salary", "Rent", "Utilities")
date        – calendar date of the transaction
notes       – optional free-text description
is_deleted  – soft-delete flag; deleted records are excluded from normal queries
created_by  – FK to the user who created the record
created_at  – auto timestamp
updated_at  – auto timestamp
"""

from django.db import models
from django.core.validators import MinValueValidator
from apps.users.models import User


class RecordType(models.TextChoices):
    INCOME  = "income",  "Income"
    EXPENSE = "expense", "Expense"


class FinancialRecordManager(models.Manager):
    def active(self):
        """Exclude soft-deleted records."""
        return self.filter(is_deleted=False)


class FinancialRecord(models.Model):
    amount     = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    type       = models.CharField(max_length=10, choices=RecordType.choices)
    category   = models.CharField(max_length=100)
    date       = models.DateField()
    notes      = models.TextField(blank=True, default="")
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="records",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = FinancialRecordManager()

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes  = [
            models.Index(fields=["type"]),
            models.Index(fields=["category"]),
            models.Index(fields=["date"]),
            models.Index(fields=["is_deleted"]),
        ]

    def __str__(self):
        return f"{self.type.upper()} | {self.category} | {self.amount} | {self.date}"
