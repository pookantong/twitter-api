import { Types } from 'mongoose';
import { Comment } from 'src/modules/comment/schema/comment.schema';

export interface IUser {
  username: string;
  profileName: string;
  bio: string;
  isFollow: boolean;
  totalFollower: number;
  totalFollowing: number;
  joinAt: Date;
  profilePictureName: string;
  coverImageName: string
}
