import { Types } from 'mongoose';

export interface IComment {
  postId: Types.ObjectId;
  commentId: Types.ObjectId;
  body: string;
  username: string;
  replyName?: string;
  timePassed: string;
  totalLiked: number;
  imageUrl: string[];
  liked: boolean;
}
