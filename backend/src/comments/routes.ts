import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../auth/requireAuth";

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1).max(300),
});

// Get comments for a post
router.get("/:postId", requireAuth, async (req: AuthedRequest, res) => {
  const { postId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  res.json({ comments });
});

// Create a comment
router.post("/:postId", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { postId } = req.params;

  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!postExists) return res.status(404).json({ error: "Post not found" });

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: req.userId!,
      content: parsed.data.content,
    },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ comment });
});

export default router;