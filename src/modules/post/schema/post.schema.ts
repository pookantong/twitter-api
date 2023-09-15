import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ default: '' })
  body: string;

  @Prop({ required: true })
  authorId: Types.ObjectId;

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

export const PostSchema = SchemaFactory.createForClass(Post);
