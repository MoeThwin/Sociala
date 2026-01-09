import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../auth/requireAuth";

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  imageUrl: z.string().min(1).optional(),
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const post = await prisma.post.create({
    data: {
      authorId: req.userId!,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl,
    },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return res.status(201).json({ post });
});

router.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const postId = req.params.id;
  const userId = req.userId!;

  const postExists = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!postExists) return res.status(404).json({ error: "Post not found" });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
    const count = await prisma.like.count({ where: { postId } });
    return res.json({ liked: false, likesCount: count });
  } else {
    await prisma.like.create({
      data: { userId, postId },
    });
    const count = await prisma.like.count({ where: { postId } });
    return res.json({ liked: true, likesCount: count });
  }
});

// Global feed: latest posts
router.get("/feed", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId },
        select: { userId: true }, // just to check if liked
      },
    },
  });

  const shaped = posts.map((p) => ({
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    author: p.author,
    _count: p._count,
    likedByMe: p.likes.length > 0,
  }));

  return res.json({ posts: shaped });
});



export default router;