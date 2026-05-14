import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { Post, Comment, User } from '../../models/models';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  loading = false;
  currentUser: User | null = null;
  isModerator = false;

  newCommentContent = '';
  editingCommentId: number | null = null;
  editingCommentContent = '';
  submittingComment = false;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private userService: UserService,
    public voteService: VoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
    this.isModerator = this.userService.isModerator();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPost(id);
  }

  loadPost(id: number): void {
    this.loading = true;
    this.postService.getPostById(id).subscribe({
      next: post => {
        this.post = post;
        this.loadComments(id);
        this.loading = false;
      },
      error: () => { this.loading = false; alert('Postarea nu a fost găsită.'); }
    });
  }

  loadComments(postId: number): void {
    this.postService.getComments(postId).subscribe({
      next: comments => {
        this.comments = comments.sort((a, b) =>
          this.voteService.getVoteCount('comment', b.id) - this.voteService.getVoteCount('comment', a.id)
        );
      }
    });
  }

  addComment(): void {
    if (!this.currentUser || !this.post) return;
    if (!this.newCommentContent.trim()) { alert('Comentariul nu poate fi gol.'); return; }
    if (this.post.status === 'OUTDATED') { alert('Această postare nu mai acceptă comentarii.'); return; }

    this.submittingComment = true;
    this.postService.addComment(this.post.id, {
      authorId: this.currentUser.id,
      content: this.newCommentContent.trim()
    }).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.submittingComment = false;
        this.loadPost(this.post!.id);
      },
      error: () => { this.submittingComment = false; alert('Eroare la adăugarea comentariului.'); }
    });
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  saveComment(comment: Comment): void {
    if (!this.currentUser || !this.post) return;
    this.postService.updateComment(this.post.id, comment.id, this.editingCommentContent, this.currentUser.id).subscribe({
      next: () => {
        this.editingCommentId = null;
        this.loadPost(this.post!.id);
      },
      error: () => alert('Eroare la editarea comentariului.')
    });
  }

  deleteComment(comment: Comment): void {
    if (!this.currentUser || !this.post) return;
    if (!confirm('Ștergi comentariul?')) return;
    this.postService.deleteComment(this.post.id, comment.id, this.currentUser.id).subscribe({
      next: () => this.loadPost(this.post!.id),
      error: () => alert('Nu poți șterge acest comentariu.')
    });
  }

  votePost(direction: 'UP' | 'DOWN'): void {
    if (!this.currentUser || !this.post) return;
    const newCount = this.voteService.vote('post', this.post.id, direction, this.currentUser.id, this.post.author.id);
    this.post.voteCount = newCount;
  }

  voteComment(comment: Comment, direction: 'UP' | 'DOWN'): void {
    if (!this.currentUser || !this.post) return;
    this.voteService.vote('comment', comment.id, direction, this.currentUser.id, comment.author.id);
    this.comments = [...this.comments].sort((a, b) =>
      this.voteService.getVoteCount('comment', b.id) - this.voteService.getVoteCount('comment', a.id)
    );
  }

  lockPost(): void {
    if (!this.currentUser || !this.post) return;
    if (!confirm('Blochezi comentariile acestei postări?')) return;
    this.postService.lockPost(this.post.id, this.currentUser.id).subscribe({
      next: post => { this.post = post; },
      error: () => alert('Eroare la blocare.')
    });
  }

  deletePost(): void {
    if (!this.currentUser || !this.post) return;
    if (!confirm('Ștergi postarea?')) return;
    this.postService.deletePost(this.post.id, this.currentUser.id).subscribe({
      next: () => this.router.navigate(['/posts']),
      error: () => alert('Nu poți șterge această postare.')
    });
  }

  getPostVoteCount(): number {
    return this.post ? this.voteService.getVoteCount('post', this.post.id) : 0;
  }

  getPostUserVote(): 'UP' | 'DOWN' | null {
    return this.post ? this.voteService.getState('post', this.post.id).userVote : null;
  }

  getCommentVoteCount(comment: Comment): number {
    return this.voteService.getVoteCount('comment', comment.id);
  }

  getCommentUserVote(comment: Comment): 'UP' | 'DOWN' | null {
    return this.voteService.getState('comment', comment.id).userVote;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'JUST_POSTED': 'Tocmai postat',
      'FIRST_REACTIONS': 'Prime reacții',
      'OUTDATED': 'Expirat'
    };
    return map[status] || status;
  }

  isPostAuthor(): boolean {
    return !!this.currentUser && !!this.post && this.currentUser.id === this.post.author.id;
  }

  canComment(): boolean {
    return !!this.currentUser && !!this.post && this.post.status !== 'OUTDATED';
  }
}
