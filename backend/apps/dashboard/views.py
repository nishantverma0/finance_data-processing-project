"""
Dashboard views.

Access control
──────────────────────────────────────────────────────
Endpoint                    VIEWER   ANALYST   ADMIN
──────────────────────────────────────────────────────
GET /dashboard/summary/       ✓        ✓        ✓
GET /dashboard/categories/    ✗        ✓        ✓
GET /dashboard/recent/        ✓        ✓        ✓
GET /dashboard/trends/monthly/✗        ✓        ✓
GET /dashboard/trends/weekly/ ✗        ✓        ✓
──────────────────────────────────────────────────────

All endpoints accept optional query params:
    date_from=YYYY-MM-DD
    date_to=YYYY-MM-DD
"""

from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsAnalystOrAbove
from . import services


def _date_filters(request) -> dict:
    """
    Parse optional date_from / date_to query params into ORM filter kwargs.
    Invalid dates are silently ignored.
    """
    filters = {}
    for param, lookup in [("date_from", "date__gte"), ("date_to", "date__lte")]:
        raw = request.query_params.get(param)
        if raw:
            try:
                filters[lookup] = date.fromisoformat(raw)
            except ValueError:
                pass  # bad date format — ignore
    return filters


class SummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/
    Available to all authenticated users (viewers, analysts, admins).
    Returns: total_income, total_expenses, net_balance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = services.get_summary(filters=_date_filters(request))
        return Response(data)


class CategoryBreakdownView(APIView):
    """
    GET /api/v1/dashboard/categories/
    Analyst / Admin only.
    Returns per-category totals grouped by transaction type.
    """
    permission_classes = [IsAuthenticated, IsAnalystOrAbove]

    def get(self, request):
        data = services.get_category_breakdown(filters=_date_filters(request))
        return Response(data)


class RecentActivityView(APIView):
    """
    GET /api/v1/dashboard/recent/?limit=10
    Available to all authenticated users.
    Returns the N most recent financial records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = min(int(request.query_params.get("limit", 10)), 50)
        except (ValueError, TypeError):
            limit = 10
        data = services.get_recent_activity(limit=limit)
        return Response(data)


class MonthlyTrendView(APIView):
    """
    GET /api/v1/dashboard/trends/monthly/
    Analyst / Admin only.
    Returns month-by-month income, expense, and net.
    """
    permission_classes = [IsAuthenticated, IsAnalystOrAbove]

    def get(self, request):
        data = services.get_monthly_trend(filters=_date_filters(request))
        return Response(data)


class WeeklyTrendView(APIView):
    """
    GET /api/v1/dashboard/trends/weekly/
    Analyst / Admin only.
    Returns week-by-week income, expense, and net.
    """
    permission_classes = [IsAuthenticated, IsAnalystOrAbove]

    def get(self, request):
        data = services.get_weekly_trend(filters=_date_filters(request))
        return Response(data)
