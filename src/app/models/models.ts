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
}

export interface VoteRequest {
  userId: number;
  voteType: 'UP' | 'DOWN';
}
