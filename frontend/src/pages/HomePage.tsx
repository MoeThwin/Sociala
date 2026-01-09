import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h2>Sociala</h2>
      <p>Logged in as: <b>{user?.username}</b> ({user?.email})</p>
      <button onClick={logout} style={{ padding: 10 }}>Logout</button>
      <hr style={{ margin: "20px 0" }} />
      <p>Next: we build Posts (create + feed) 🔥</p>
    </div>
  );
}