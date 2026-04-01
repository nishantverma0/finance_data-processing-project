"""
User model with role-based access control.

Roles
-----
VIEWER   – read-only access to dashboard data
ANALYST  – read + analytics/summaries
ADMIN    – full access (create, update, delete records and users)

The model extends AbstractBaseUser so we own the authentication flow
and can attach our own fields cleanly.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    VIEWER  = "viewer",  "Viewer"
    ANALYST = "analyst", "Analyst"
    ADMIN   = "admin",   "Admin"


class UserManager(BaseUserManager):
    def create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault("role", Role.ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email      = models.EmailField(unique=True)
    name       = models.CharField(max_length=150)
    role       = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} <{self.email}> [{self.role}]"

    # ── Convenience helpers used in permissions ─────────────────────────────
    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_analyst(self):
        return self.role in (Role.ANALYST, Role.ADMIN)
