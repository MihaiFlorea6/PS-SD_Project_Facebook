import { Injectable } from '@angular/core';

export interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: 'UP' | 'DOWN' | null;
}

@Injectable({ providedIn: 'root' })
export class VoteService {
  private storageKey = 'fb_votes';
  private scoreKey = 'fb_scores';
  private votes: Record<string, VoteState> = {};
  private scores: Record<number, number> = {};

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) this.votes = JSON.parse(saved);
    const savedScores = localStorage.getItem(this.scoreKey);
    if (savedScores) this.scores = JSON.parse(savedScores);
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.votes));
    localStorage.setItem(this.scoreKey, JSON.stringify(this.scores));
  }

  getKey(type: 'post' | 'comment', id: number): string {
    return `${type}_${id}`;
  }

  getState(type: 'post' | 'comment', id: number): VoteState {
    const key = this.getKey(type, id);
    if (!this.votes[key]) {
      this.votes[key] = { upvotes: 0, downvotes: 0, userVote: null };
    }
    return this.votes[key];
  }

  getVoteCount(type: 'post' | 'comment', id: number): number {
    const s = this.getState(type, id);
    return s.upvotes - s.downvotes;
  }

  // Returns new voteCount
  vote(
    type: 'post' | 'comment',
    id: number,
    direction: 'UP' | 'DOWN',
    currentUserId: number,
    contentAuthorId: number
  ): number {
    if (currentUserId === contentAuthorId) {
      alert('Nu poți vota propriul tău conținut!');
      return this.getVoteCount(type, id);
    }
    const key = this.getKey(type, id);
    const state = this.getState(type, id);
    const prevVote = state.userVote;

    // Toggle off if same vote
    if (prevVote === direction) {
      if (direction === 'UP') state.upvotes--;
      else state.downvotes--;
      state.userVote = null;
      this.updateScore(contentAuthorId, type, direction, 'remove');
    } else {
      // Remove previous vote
      if (prevVote === 'UP') {
        state.upvotes--;
        this.updateScore(contentAuthorId, type, 'UP', 'remove');
      } else if (prevVote === 'DOWN') {
        state.downvotes--;
        this.updateScore(contentAuthorId, type, 'DOWN', 'remove');
        // Downvoter gets back their -1.5
        this.scores[currentUserId] = (this.scores[currentUserId] || 0) + 1.5;
      }
      // Add new vote
      if (direction === 'UP') state.upvotes++;
      else {
        state.downvotes++;
        // Downvoter loses 1.5 points
        this.scores[currentUserId] = (this.scores[currentUserId] || 0) - 1.5;
      }
      state.userVote = direction;
      this.updateScore(contentAuthorId, type, direction, 'add');
    }
    this.votes[key] = state;
    this.save();
    return state.upvotes - state.downvotes;
  }

  private updateScore(
    authorId: number,
    type: 'post' | 'comment',
    direction: 'UP' | 'DOWN',
    action: 'add' | 'remove'
  ) {
    if (!this.scores[authorId]) this.scores[authorId] = 0;
    let delta = 0;
    if (type === 'post') {
      delta = direction === 'UP' ? 2.5 : -1.5;
    } else {
      delta = direction === 'UP' ? 5 : -2.5;
    }
    if (action === 'remove') delta = -delta;
    this.scores[authorId] += delta;
    this.save();
  }

  getUserScore(userId: number): number {
    return Math.round((this.scores[userId] || 0) * 10) / 10;
  }
}
