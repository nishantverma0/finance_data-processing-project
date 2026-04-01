"""
Custom DRF exception handler.

Normalises all error responses to:
  { "error": "<message>", "detail": <original_detail> }
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data

        # Flatten single-key "detail" dicts
        if isinstance(data, dict) and list(data.keys()) == ["detail"]:
            message = str(data["detail"])
        elif isinstance(data, dict):
            # Collect field-level validation errors into a readable string
            messages = []
            for field, errors in data.items():
                if isinstance(errors, list):
                    messages.append(f"{field}: {', '.join(str(e) for e in errors)}")
                else:
                    messages.append(f"{field}: {errors}")
            message = " | ".join(messages)
        else:
            message = str(data)

        response.data = {
            "error": message,
            "status_code": response.status_code,
        }

    return response
