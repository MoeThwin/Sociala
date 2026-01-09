import { api } from "./api";

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl?: string | null };
};

export async function getComments(accessToken: string, postId: string) {
  return api<{ comments: Comment[] }>(`/comments/${postId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createComment(
  accessToken: string,
  postId: string,
  content: string
) {
  return api<{ comment: Comment }>(`/comments/${postId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content }),
  });
}