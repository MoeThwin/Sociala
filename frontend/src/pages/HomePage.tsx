import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as postsApi from "../lib/postsApi";
import { uploadImage } from "../lib/uploadsApi";
import Comments from "../components/Comments";

export default function HomePage() {
  const { user, logout, accessToken } = useAuth();
  const [posts, setPosts] = useState<postsApi.Post[]>([]);
  const [content, setContent] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function loadFeed() {
    if (!accessToken) return;
    const res = await postsApi.getFeed(accessToken);
    setPosts(res.posts);
  }

  useEffect(() => {
    loadFeed().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // cleanup preview blob url (prevents memory leaks)
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function onCreate() {
    if (!accessToken) return;
    if (!content.trim() && !imageFile) return;

    setBusy(true);
    setErr(null);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const up = await uploadImage(accessToken, imageFile);
        imageUrl = up.url; // "/uploads/xxxx.png"
      }

      await postsApi.createPost(accessToken, content.trim() || "(image)", imageUrl);

      setContent("");

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(null);

      await loadFeed();
    } catch (e: any) {
      setErr(e.message || "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleLike(postId: string) {
    if (!accessToken) return;

    // optimistic update
    setPosts((prev) =>
      prev.map((x) =>
        x.id === postId
          ? {
              ...x,
              likedByMe: !x.likedByMe,
              _count: {
                ...x._count,
                likes: x.likedByMe ? x._count.likes - 1 : x._count.likes + 1,
              },
            }
          : x
      )
    );

    try {
      const r = await postsApi.toggleLike(accessToken, postId);
      setPosts((prev) =>
        prev.map((x) =>
          x.id === postId
            ? { ...x, likedByMe: r.liked, _count: { ...x._count, likes: r.likesCount } }
            : x
        )
      );
    } catch {
      // revert if failed
      setPosts((prev) =>
        prev.map((x) =>
          x.id === postId
            ? {
                ...x,
                likedByMe: !x.likedByMe,
                _count: {
                  ...x._count,
                  likes: x.likedByMe ? x._count.likes - 1 : x._count.likes + 1,
                },
              }
            : x
        )
      );
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Sociala</h2>
          <p style={{ margin: "6px 0" }}>
            Logged in as <b>{user?.username}</b>
          </p>
        </div>
        <button onClick={logout} style={{ padding: 10 }}>
          Logout
        </button>
      </div>

      <div style={{ marginTop: 20, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What’s happening?"
          rows={3}
          style={{ width: "100%", padding: 10, resize: "vertical" }}
        />

        {/* Image picker */}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;

            // clear old preview url
            if (imagePreview) URL.revokeObjectURL(imagePreview);

            setImageFile(f);
            setImagePreview(f ? URL.createObjectURL(f) : null);
          }}
          style={{ marginTop: 10 }}
        />

        {/* Preview + remove */}
        {imagePreview && (
          <div style={{ marginTop: 10 }}>
            <img
              src={imagePreview}
              alt="preview"
              style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #ddd" }}
            />
            <button
              onClick={() => {
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setImageFile(null);
                setImagePreview(null);
              }}
              style={{ marginTop: 8, padding: 8 }}
            >
              Remove image
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button disabled={busy} onClick={onCreate} style={{ padding: "10px 14px" }}>
            {busy ? "Posting..." : "Post"}
          </button>
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>

      <h3 style={{ marginTop: 24 }}>Feed</h3>

      {posts.length === 0 ? (
        <p>No posts yet. Create the first one 👀</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>@{p.author.username}</b>
                <span style={{ opacity: 0.7, fontSize: 12 }}>
                  {new Date(p.createdAt).toLocaleString()}
                </span>
              </div>

              <p style={{ marginTop: 8 }}>{p.content}</p>

              {/* Show uploaded image */}
              {p.imageUrl && (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${p.imageUrl}`}
                  alt="post"
                  style={{
                    width: "100%",
                    marginTop: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                  }}
                />
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                <button
                  onClick={() => onToggleLike(p.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: p.likedByMe ? "#ffe6e6" : "white",
                    cursor: "pointer",
                  }}
                >
                  {p.likedByMe ? "❤️ Liked" : "🤍 Like"} ({p._count.likes})
                </button>

                <span style={{ opacity: 0.8, fontSize: 12 }}>💬 {p._count.comments}</span>
              </div>

              <Comments postId={p.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}