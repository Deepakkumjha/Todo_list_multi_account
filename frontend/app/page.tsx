"use client";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Todo = { id: number; title: string; description: string; completed: boolean; created_at: string; updated_at: string };
type Filter = "all" | "active" | "completed";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function messageFor(error: unknown) {
  const text = error instanceof Error ? error.message : "Something went wrong.";
  if (text.includes("401")) return "Your session has expired. Please sign in again.";
  if (text.includes("403")) return "You don't have permission to do that.";
  if (text.includes("404")) return "That todo no longer exists.";
  return text;
}

function Dashboard() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const [todos, setTodos] = useState<Todo[]>([]); const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState(""); const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<number | null>(null);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getAccessTokenSilently();
    const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers } });
    if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(`${response.status}: ${body?.detail || "Request failed"}`); }
    return response.status === 204 ? null : response.json();
  }, [getAccessTokenSilently]);

  const loadTodos = useCallback(async () => { if (!isAuthenticated) return; setLoading(true); setNotice(""); try { const params = new URLSearchParams(); if (filter !== "all") params.set("status", filter); if (search) params.set("search", search); setTodos(await request(`/todos/?${params}`)); } catch (error) { setNotice(messageFor(error)); } finally { setLoading(false); } }, [filter, isAuthenticated, request, search]);
  useEffect(() => { const timer = setTimeout(loadTodos, 180); return () => clearTimeout(timer); }, [loadTodos]);

  async function createTodo(event: FormEvent) { event.preventDefault(); if (!title.trim() || saving) return; setSaving(true); try { const todo = await request("/todos/", { method: "POST", body: JSON.stringify({ title: title.trim(), description: description.trim() }) }); setTodos((items) => [todo, ...items]); setTitle(""); setDescription(""); setNotice("Todo created."); } catch (error) { setNotice(messageFor(error)); } finally { setSaving(false); } }
  async function updateTodo(id: number, patch: Partial<Todo>) { try { const todo = await request(`/todos/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }); setTodos((items) => items.map((item) => item.id === id ? todo : item)); setEditing(null); setNotice("Todo updated."); } catch (error) { setNotice(messageFor(error)); } }
  async function deleteTodo(id: number) { if (!confirm("Delete this todo?")) return; try { await request(`/todos/${id}/`, { method: "DELETE" }); setTodos((items) => items.filter((item) => item.id !== id)); setNotice("Todo deleted."); } catch (error) { setNotice(messageFor(error)); } }

  if (isLoading) return <main className="center">Loading…</main>;
  if (!isAuthenticated) return <main className="landing"><div><p className="eyebrow">PRIVATE • SIMPLE • YOURS</p><h1>Focus on what<br />matters.</h1><p>One quiet place for your work. Your todos are private to your account.</p><button onClick={() => loginWithRedirect()}>Log in or sign up <span>→</span></button></div></main>;
  return <main className="shell"><header><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.given_name || user?.name || "there"}.</h1></div><button className="text-button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log out</button></header><section className="composer"><h2>Add a task</h2><form onSubmit={createTodo}><input aria-label="Todo title" placeholder="What needs to get done?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required /><input aria-label="Todo description" placeholder="Add a note (optional)" value={description} onChange={(e) => setDescription(e.target.value)} /><button disabled={saving}>{saving ? "Adding…" : "Add task"}</button></form></section><section className="toolbar"><div>{(["all", "active", "completed"] as Filter[]).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><input aria-label="Search todos" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} /></section>{notice && <p className="notice" role="status">{notice}</p>}<section className="list"><h2>{filter === "all" ? "All tasks" : `${filter[0].toUpperCase()}${filter.slice(1)} tasks`} <span>{todos.length}</span></h2>{loading ? <p className="muted">Refreshing tasks…</p> : todos.length === 0 ? <div className="empty">No tasks here yet. Add one above.</div> : todos.map((todo) => <TodoRow key={todo.id} todo={todo} editing={editing === todo.id} onEdit={() => setEditing(todo.id)} onCancel={() => setEditing(null)} onSave={(data) => updateTodo(todo.id, data)} onToggle={() => updateTodo(todo.id, { completed: !todo.completed })} onDelete={() => deleteTodo(todo.id)} />)}</section></main>;
}

function TodoRow({ todo, editing, onEdit, onCancel, onSave, onToggle, onDelete }: { todo: Todo; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (data: Partial<Todo>) => void; onToggle: () => void; onDelete: () => void }) {
  const [title, setTitle] = useState(todo.title); const [description, setDescription] = useState(todo.description);
  useEffect(() => { setTitle(todo.title); setDescription(todo.description); }, [todo]);
  return <article className={`todo ${todo.completed ? "done" : ""}`}><button className="check" aria-label={todo.completed ? "Mark incomplete" : "Mark complete"} onClick={onToggle}>{todo.completed && "✓"}</button>{editing ? <div className="edit"><input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><div><button onClick={() => onSave({ title: title.trim(), description })} disabled={!title.trim()}>Save</button><button className="text-button" onClick={onCancel}>Cancel</button></div></div> : <div className="todo-copy"><strong>{todo.title}</strong>{todo.description && <p>{todo.description}</p>}</div>} {!editing && <div className="actions"><button className="icon" aria-label="Edit todo" onClick={onEdit}>Edit</button><button className="icon danger" aria-label="Delete todo" onClick={onDelete}>Delete</button></div>}</article>;
}

export default function Page() {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN; const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID; const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  if (!domain || !clientId || !audience) return <main className="center">Configure Auth0 in <code>.env.local</code> to start the app.</main>;
  return <Auth0Provider domain={domain} clientId={clientId} authorizationParams={{ redirect_uri: typeof window !== "undefined" ? window.location.origin : "", audience, scope: "openid profile email" }} cacheLocation="localstorage"><Dashboard /></Auth0Provider>;
}
