import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { Post, Tag, User } from '../../models/models';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit {
  posts: Post[] = [];
  tags: Tag[] = [];
  loading = false;
  currentUser: User | null = null;

  searchQuery = '';
  selectedTag = '';
  filterMine = false;

  constructor(
    private postService: PostService,
    private userService: UserService,
    public voteService: VoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
    this.loadPosts();
    this.postService.getAllTags().subscribe(tags => this.tags = tags);
  }

  loadPosts(): void {
    this.loading = true;
    let obs;
    if (this.filterMine && this.currentUser) {
      obs = this.postService.getPostsByAuthor(this.currentUser.id);
    } else if (this.searchQuery.trim()) {
      obs = this.postService.searchPosts(this.searchQuery.trim());
    } else if (this.selectedTag) {
      obs = this.postService.getPostsByTag(this.selectedTag);
    } else {
      obs = this.postService.getAllPosts();
    }
    obs.subscribe({
      next: posts => { this.posts = posts; this.loading = false; },
      error: () => { this.loading = false; alert('Eroare la încărcarea postărilor.'); }
    });
  }

  onSearch(): void {
    this.selectedTag = '';
    this.filterMine = false;
    this.loadPosts();
  }

  onTagFilter(tag: string): void {
    this.selectedTag = tag;
    this.searchQuery = '';
    this.filterMine = false;
    this.loadPosts();
  }

  onFilterMine(): void {
    this.filterMine = true;
    this.selectedTag = '';
    this.searchQuery = '';
    this.loadPosts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTag = '';
    this.filterMine = false;
    this.loadPosts();
  }

  deletePost(post: Post, event: Event): void {
    event.stopPropagation();
    if (!this.currentUser) return;
    if (!confirm(`Ștergi postarea "${post.title}"?`)) return;
    this.postService.deletePost(post.id, this.currentUser.id).subscribe({
      next: () => this.loadPosts(),
      error: () => alert('Nu poți șterge această postare.')
    });
  }

  vote(post: Post, direction: 'UP' | 'DOWN', event: Event): void {
    event.stopPropagation();
    if (!this.currentUser) { alert('Trebuie să fii autentificat pentru a vota!'); return; }
    const newCount = this.voteService.vote('post', post.id, direction, this.currentUser.id, post.author.id);
    post.voteCount = newCount;
  }

  getVoteCount(post: Post): number {
    return this.voteService.getVoteCount('post', post.id, this.currentUser?.id);
  }

  getUserVote(post: Post): 'UP' | 'DOWN' | null {
    return this.voteService.getState('post', post.id, this.currentUser?.id).userVote;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'JUST_POSTED': 'Tocmai postat',
      'FIRST_REACTIONS': 'Prime reacții',
      'OUTDATED': 'Expirat'
    };
    return map[status] || status;
  }

  goToPost(id: number): void {
    this.router.navigate(['/posts', id]);
  }
}
