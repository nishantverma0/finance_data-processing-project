"""
Root URL configuration.

All API routes are versioned under /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import LoginView
from django.http import JsonResponse  # add this at the top

def api_root(request):
    return JsonResponse({
        "message": "Finance Dashboard API",
        "version": "v1",
        "endpoints": {
            "login":     "/api/v1/auth/login/",
            "refresh":   "/api/v1/auth/refresh/",
            "users":     "/api/v1/users/",
            "records":   "/api/v1/records/",
            "dashboard": "/api/v1/dashboard/",
        }
    })
urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/v1/auth/login/",   LoginView.as_view(),        name="token_obtain"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Feature modules
    path("api/v1/users/",     include("apps.users.urls")),
    path("api/v1/records/",   include("apps.records.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
]
