import { api } from "./api";

export type Post = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  author: { id: string; username: string; avatarUrl?: string | null };
  _count: { likes: number; comments: number };
  likedByMe: boolean;
};

export async function getFeed(accessToken: string) {
  return api<{ posts: Post[] }>("/posts/feed", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createPost(accessToken: string, content: string, imageUrl?: string) {
  return api<{ post: Post }>("/posts", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content, imageUrl }),
  });
}

export async function toggleLike(accessToken: string, postId: string) {
  return api<{ liked: boolean; likesCount: number }>(`/posts/${postId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

