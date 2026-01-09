import { useEffect, useState } from "react";
import * as commentsApi from "../lib/commentsApi";
import { useAuth } from "../auth/AuthContext";

export default function Comments({ postId }: { postId: string }) {
  const { accessToken } = useAuth();
  const [comments, setComments] = useState<commentsApi.Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!accessToken) return;
    const res = await commentsApi.getComments(accessToken, postId);
    setComments(res.comments);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!content.trim() || !accessToken) return;
    setLoading(true);
    const res = await commentsApi.createComment(accessToken, postId, content.trim());
    setComments((prev) => [...prev, res.comment]);
    setContent("");
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      {comments.map((c) => (
        <div key={c.id} style={{ fontSize: 14, marginBottom: 6 }}>
          <b>@{c.author.username}</b> {c.content}
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          style={{ flex: 1, padding: 6 }}
        />
        <button onClick={submit} disabled={loading}>
          {loading ? "..." : "Post"}
        </button>
      </div>
    </div>
  );
}