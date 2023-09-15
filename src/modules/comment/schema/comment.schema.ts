import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ default: '' })
  body: string;

  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  postId: Types.ObjectId;

  @Prop({ default: [] })
  likedIds: Types.ObjectId[];

  @Prop({ default: [] })
  comments: Types.ObjectId[];

  @Prop({ default: [] })
  imageNames: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
