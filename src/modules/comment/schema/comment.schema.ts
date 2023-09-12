import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop()
  body: string;

  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  postId: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(Post);
