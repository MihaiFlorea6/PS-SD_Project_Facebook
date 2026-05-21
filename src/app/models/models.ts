export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'MODERATOR';
  banned: boolean;
  bannedAt?: string;
  createdAt?: string;
  score?: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  content: string;
  imageUrl?: string;   // FEATURE 2: imaginea comentariului
  createdAt: string;
  updatedAt?: string;
  author: User;
  voteCount?: number;
  userVote?: 'UP' | 'DOWN' | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  status: 'JUST_POSTED' | 'FIRST_REACTIONS' | 'OUTDATED';
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  author: User;
  tags: Tag[];
  comments: Comment[];
  voteCount?: number;
  userVote?: 'UP' | 'DOWN' | null;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  authorId: number;
  imageUrl?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  authorId: number;
  content: string;
  imageUrl?: string;   // FEATURE 2: imaginea comentariului
}

export interface VoteRequest {
  userId: number;
  voteType: 'UP' | 'DOWN';
}
