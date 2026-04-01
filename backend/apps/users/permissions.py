"""
Role-based permission classes.

These are thin wrappers around Django REST Framework's BasePermission.
Compose them with DRF's standard IsAuthenticated for full guards:

    permission_classes = [IsAuthenticated, IsAdmin]
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only ADMIN role users are allowed."""
    message = "Admin role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsAnalystOrAbove(BasePermission):
    """ANALYST or ADMIN role users are allowed."""
    message = "Analyst or Admin role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_analyst)


class IsAdminOrReadOnly(BasePermission):
    """
    ADMIN can do anything.
    Any authenticated user can use safe (GET, HEAD, OPTIONS) methods.
    """
    message = "Admin role required to modify data."

    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.is_admin
