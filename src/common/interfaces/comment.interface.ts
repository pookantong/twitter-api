import { Types } from 'mongoose';

export interface IComment {
  postId: Types.ObjectId;
  body: string;
  username: string;
  replyName?: string;
  timePassed: string;
  totalLiked: number;
  imageUrl: string[];
  liked: boolean;
}
