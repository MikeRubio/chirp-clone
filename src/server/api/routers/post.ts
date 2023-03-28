import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    userName: user.username,
    profileImageUrl: user.profileImageUrl,
  };
}

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((p) => p.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((u) => u.id === post.authorId);

      if (!author || !author.userName) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Author not found'});
      }

      return {
          post,
          author,
      };
    });
  }),
});
