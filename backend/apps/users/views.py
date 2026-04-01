"""
User management views.

Endpoints
---------
POST   /api/v1/auth/login/          – obtain JWT tokens
GET    /api/v1/users/               – list users           [admin]
POST   /api/v1/users/               – create user          [admin]
GET    /api/v1/users/{id}/          – retrieve user        [admin]
PATCH  /api/v1/users/{id}/          – update user          [admin]
DELETE /api/v1/users/{id}/          – soft-delete (deactivate) [admin]
GET    /api/v1/users/me/            – own profile          [any authenticated]
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import UserCreateSerializer, UserUpdateSerializer, UserDetailSerializer
from .permissions import IsAdmin


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Body: { "email": "...", "password": "..." }
    Returns access + refresh JWT tokens.
    """
    pass  # TokenObtainPairView already handles everything


# ── User CRUD ─────────────────────────────────────────────────────────────────

class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  – list all users (admin only)
    POST – create a new user (admin only)
    """
    queryset             = User.objects.all().order_by("name")
    permission_classes   = [IsAuthenticated, IsAdmin]
    filterset_fields     = ["role", "is_active"]
    search_fields        = ["name", "email"]

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserDetailSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    – retrieve user
    PATCH  – partial update (role, active status, name)
    DELETE – soft-delete by setting is_active=False
    All admin only.
    """
    queryset           = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names  = ["get", "patch", "delete"]  # no full PUT

    def get_serializer_class(self):
        return UserUpdateSerializer if self.request.method == "PATCH" else UserDetailSerializer

    def destroy(self, request, *args, **kwargs):
        """Soft delete — deactivates user instead of removing the record."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {"error": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"detail": "User deactivated."}, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/v1/users/me/
    Returns the profile of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
