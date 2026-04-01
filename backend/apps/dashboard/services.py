"""
Dashboard service layer.

All aggregation queries are centralised here so views stay thin and
the logic can be tested independently.
"""

from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncWeek

from apps.records.models import FinancialRecord, RecordType


def _active_records(filters: dict = None):
    """Base queryset – active records only, with optional extra filters."""
    qs = FinancialRecord.objects.active()
    if filters:
        qs = qs.filter(**filters)
    return qs


def get_summary(filters: dict = None) -> dict:
    """
    Return top-level totals: total income, total expenses, net balance.

    `filters` is forwarded to the queryset (e.g. date range).
    """
    qs = _active_records(filters)

    agg = qs.aggregate(
        total_income=Sum(
            "amount", filter=Q(type=RecordType.INCOME), default=Decimal("0.00")
        ),
        total_expense=Sum(
            "amount", filter=Q(type=RecordType.EXPENSE), default=Decimal("0.00")
        ),
    )

    income  = agg["total_income"]  or Decimal("0.00")
    expense = agg["total_expense"] or Decimal("0.00")

    return {
        "total_income":   income,
        "total_expenses": expense,
        "net_balance":    income - expense,
    }


def get_category_breakdown(filters: dict = None) -> list:
    """
    Return per-category totals, split by income / expense.

    Output: [ { category, type, total, count }, … ]
    """
    qs = _active_records(filters)
    rows = (
        qs.values("category", "type")
          .annotate(total=Sum("amount"), count=Count("id"))
          .order_by("category", "type")
    )
    return list(rows)


def get_recent_activity(limit: int = 10) -> list:
    """Return the most recent `limit` active records."""
    from apps.records.serializers import FinancialRecordSerializer

    qs = _active_records().select_related("created_by")[:limit]
    return FinancialRecordSerializer(qs, many=True).data


def get_monthly_trend(filters: dict = None) -> list:
    """
    Return month-by-month income and expense totals.

    Output: [ { month (YYYY-MM-01), total_income, total_expense }, … ]
    """
    qs = _active_records(filters)
    rows = (
        qs.annotate(month=TruncMonth("date"))
          .values("month")
          .annotate(
              total_income=Sum(
                  "amount", filter=Q(type=RecordType.INCOME), default=Decimal("0.00")
              ),
              total_expense=Sum(
                  "amount", filter=Q(type=RecordType.EXPENSE), default=Decimal("0.00")
              ),
          )
          .order_by("month")
    )
    return [
        {
            "month":         r["month"].strftime("%Y-%m"),
            "total_income":  r["total_income"],
            "total_expense": r["total_expense"],
            "net":           r["total_income"] - r["total_expense"],
        }
        for r in rows
    ]


def get_weekly_trend(filters: dict = None) -> list:
    """
    Return week-by-week income and expense totals.

    Output: [ { week_start (ISO date), total_income, total_expense, net }, … ]
    """
    qs = _active_records(filters)
    rows = (
        qs.annotate(week=TruncWeek("date"))
          .values("week")
          .annotate(
              total_income=Sum(
                  "amount", filter=Q(type=RecordType.INCOME), default=Decimal("0.00")
              ),
              total_expense=Sum(
                  "amount", filter=Q(type=RecordType.EXPENSE), default=Decimal("0.00")
              ),
          )
          .order_by("week")
    )
    return [
        {
            "week_start":    r["week"].strftime("%Y-%m-%d"),
            "total_income":  r["total_income"],
            "total_expense": r["total_expense"],
            "net":           r["total_income"] - r["total_expense"],
        }
        for r in rows
    ]
