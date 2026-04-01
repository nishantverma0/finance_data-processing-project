"""
Financial records views.

Access control matrix
─────────────────────────────────────────────────────
Action                  VIEWER    ANALYST   ADMIN
─────────────────────────────────────────────────────
List / retrieve         ✓         ✓         ✓
Create                  ✗         ✗         ✓
Update (partial)        ✗         ✗         ✓
Delete (soft)           ✗         ✗         ✓
─────────────────────────────────────────────────────

Endpoints
---------
GET    /api/v1/records/           – list (filterable, searchable, paginated)
POST   /api/v1/records/           – create                      [admin]
GET    /api/v1/records/{id}/      – retrieve single record       [any auth]
PATCH  /api/v1/records/{id}/      – partial update               [admin]
DELETE /api/v1/records/{id}/      – soft delete                  [admin]
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import FinancialRecord
from .serializers import FinancialRecordSerializer
from .filters import FinancialRecordFilter
from apps.users.permissions import IsAdmin


class FinancialRecordListCreateView(generics.ListCreateAPIView):
    serializer_class   = FinancialRecordSerializer
    filterset_class    = FinancialRecordFilter
    search_fields      = ["category", "notes"]
    ordering_fields    = ["date", "amount", "created_at"]
    ordering           = ["-date"]

    def get_queryset(self):
        return FinancialRecord.objects.active().select_related("created_by")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class FinancialRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class  = FinancialRecordSerializer
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        return FinancialRecord.objects.active().select_related("created_by")

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_deleted=True instead of removing the row."""
        record = self.get_object()
        record.is_deleted = True
        record.save(update_fields=["is_deleted"])
        return Response({"detail": "Record deleted."}, status=status.HTTP_200_OK)
