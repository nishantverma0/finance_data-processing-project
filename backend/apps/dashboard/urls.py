from django.urls import path
from .views import (
    SummaryView,
    CategoryBreakdownView,
    RecentActivityView,
    MonthlyTrendView,
    WeeklyTrendView,
)

urlpatterns = [
    path("summary/",         SummaryView.as_view(),           name="dashboard-summary"),
    path("categories/",      CategoryBreakdownView.as_view(),  name="dashboard-categories"),
    path("recent/",          RecentActivityView.as_view(),     name="dashboard-recent"),
    path("trends/monthly/",  MonthlyTrendView.as_view(),       name="dashboard-monthly"),
    path("trends/weekly/",   WeeklyTrendView.as_view(),        name="dashboard-weekly"),
]
