import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Comment, Tag, CreatePostRequest, CreateCommentRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = 'http://localhost:8080/api/posts';

  constructor(private http: HttpClient) {}

  // ===== POSTS =====
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPostsByTag(tag: string): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { params: { tag } });
  }

  searchPosts(search: string): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { params: { search } });
  }

  getPostsByAuthor(authorId: number): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { params: { authorId: authorId.toString() } });
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  createPost(req: CreatePostRequest): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, req);
  }

  updatePost(id: number, title: string, content: string, userId: number): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${id}`, { title, content, userId });
  }

  deletePost(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { params: { userId: userId.toString() } });
  }

  lockPost(id: number, userId: number): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${id}/lock`, { userId });
  }

  getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/tags`);
  }

  // ===== COMMENTS =====
  getComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  addComment(postId: number, req: CreateCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, req);
  }

  updateComment(postId: number, commentId: number, content: string, userId: number): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${postId}/comments/${commentId}`, { content, userId });
  }

  deleteComment(postId: number, commentId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${postId}/comments/${commentId}`, {
      params: { userId: userId.toString() }
    });
  }

  // ===== VOTES (localStorage simulation — backend nu are endpoint de voting inca) =====
  getVoteKey(type: 'post' | 'comment', id: number): string {
    return `vote_${type}_${id}`;
  }

  getUserVote(type: 'post' | 'comment', id: number): 'UP' | 'DOWN' | null {
    return (localStorage.getItem(this.getVoteKey(type, id)) as 'UP' | 'DOWN' | null) || null;
  }

  setUserVote(type: 'post' | 'comment', id: number, vote: 'UP' | 'DOWN' | null): void {
    if (vote) {
      localStorage.setItem(this.getVoteKey(type, id), vote);
    } else {
      localStorage.removeItem(this.getVoteKey(type, id));
    }
  }

  getVoteCount(type: 'post' | 'comment', id: number): number {
    return parseInt(localStorage.getItem(`votecount_${type}_${id}`) || '0', 10);
  }

  setVoteCount(type: 'post' | 'comment', id: number, count: number): void {
    localStorage.setItem(`votecount_${type}_${id}`, count.toString());
  }
}
