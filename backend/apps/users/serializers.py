"""User serializers — creation, update, and list/detail views."""

from rest_framework import serializers
from .models import User


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ["id", "email", "name", "role", "password", "is_active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Admins can update role and active status; users can update their name."""

    class Meta:
        model  = User
        fields = ["id", "email", "name", "role", "is_active"]
        read_only_fields = ["email"]

    def validate_role(self, value):
        request = self.context.get("request")
        # Only admins may change roles
        if not request.user.is_admin:
            raise serializers.ValidationError("Only admins can change roles.")
        return value


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "email", "name", "role", "is_active", "created_at", "updated_at"]
        read_only_fields = fields
