from django.urls import path
from .views import UserListCreateView, UserDetailView, MeView

urlpatterns = [
   
    path("admin/", admin.site.urls),

    path("api/v1/auth/login/", LoginView.as_view(), name="token_obtain"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/records/", include("apps.records.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
]
