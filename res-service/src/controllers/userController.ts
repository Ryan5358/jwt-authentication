import RequestWithData from "@shared-types/requestWithData";
import { findPosts } from "@repositories/postRepository";
import User from "@shared-models/userModels";
import { Response } from "express";

export const getPosts = (req: RequestWithData, res: Response) => {
    const { user } = req.data as { user: User }

    if (user == null) {
        res.sendStatus(403)
    } else {
        res.json(findPosts({ author_id: user.id}))
    }
}