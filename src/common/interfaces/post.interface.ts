import { Date, Types } from "mongoose";

export interface IPost {
  postId: Types.ObjectId
  body: string;
  username: string;
  timePassed: string;
  totalLiked: number;
  totalComment: number;
  fileUrl: string[];
  liked: boolean
}
