import { Types } from 'mongoose';
import { Comment } from 'src/modules/comment/schema/comment.schema';

export interface IUser {
  username: string;
  bio: string;
  isFollow: boolean;
  totalfollower: number;
  totalfollowing: number;
  joinAt: Date;
  profilePictureName: string;
}
