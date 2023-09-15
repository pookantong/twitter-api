import { Types } from "mongoose";
import { IComment } from "./comment.interface";

export interface IPosts {
  posts: IPost[]
  currentPage: number
  pageSize: number
}

export interface IPost {
  postId: Types.ObjectId
  body: string;
  username: string;
  timePassed: string;
  totalLiked: number;
  totalComment: number;
  imageUrl: string[];
  liked: boolean
  comments?: IComment[]
}
