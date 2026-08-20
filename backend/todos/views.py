from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .models import Todo
from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer

    def get_queryset(self):
        queryset = Todo.objects.filter(account=self.request.user)
        state = self.request.query_params.get("status")
        if state in ("active", "completed"):
            queryset = queryset.filter(completed=(state == "completed"))
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset

    def perform_create(self, serializer):
        serializer.save(account=self.request.user)
