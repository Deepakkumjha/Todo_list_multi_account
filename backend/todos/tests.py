from rest_framework import status
from rest_framework.test import APITestCase
from .models import Account, Todo


class TodoOwnershipTests(APITestCase):
    def setUp(self):
        self.alice = Account.objects.create(auth0_user_id="auth0|alice", email="alice@example.com")
        self.bob = Account.objects.create(auth0_user_id="auth0|bob", email="bob@example.com")
        self.bob_todo = Todo.objects.create(account=self.bob, title="Private todo")

    def test_unauthenticated_requests_are_rejected(self):
        self.assertEqual(self.client.get("/api/todos/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_assigns_current_account_not_client_input(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post("/api/todos/", {"title": "Alice task", "account": self.bob.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Todo.objects.get(pk=response.data["id"]).account, self.alice)

    def test_other_account_cannot_read_update_or_delete_by_id(self):
        self.client.force_authenticate(user=self.alice)
        url = f"/api/todos/{self.bob_todo.id}/"
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.patch(url, {"title": "Stolen"}, format="json").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        self.bob_todo.refresh_from_db()
        self.assertEqual(self.bob_todo.title, "Private todo")
