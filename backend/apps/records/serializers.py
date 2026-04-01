"""Serializers for FinancialRecord."""

from rest_framework import serializers
from .models import FinancialRecord


class FinancialRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model  = FinancialRecord
        fields = [
            "id", "amount", "type", "category", "date", "notes",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_by_name", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def create(self, validated_data):
        # Attach the currently authenticated user as creator
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
