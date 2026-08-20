from django.db import models


class Account(models.Model):
    auth0_user_id = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email or self.auth0_user_id

    @property
    def is_authenticated(self):
        """Lets DRF treat Auth0-backed accounts as authenticated principals."""
        return True

    @property
    def is_anonymous(self):
        return False


class Todo(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="todos")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("completed", "-created_at")

    def __str__(self):
        return self.title
