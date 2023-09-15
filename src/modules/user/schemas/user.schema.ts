import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  username: string;

  @Prop()
  profileName: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  profileImageName: string;

  @Prop({ default: [] })
  posts: Types.ObjectId[];

  @Prop({ default: [] })
  follower: Types.ObjectId[];

  @Prop({ default: [] })
  following: Types.ObjectId[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
