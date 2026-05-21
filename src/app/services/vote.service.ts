import { Injectable } from '@angular/core';

export interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: 'UP' | 'DOWN' | null;
}

@Injectable({ providedIn: 'root' })
export class VoteService {
  private scoreKey = 'fb_scores';
  private scores: Record<number, number> = {};

  constructor() {
    const savedScores = localStorage.getItem(this.scoreKey);
    if (savedScores) this.scores = JSON.parse(savedScores);
  }

  // Cheia de storage depinde de userul curent
  private getStorageKey(userId: number): string {
    return `fb_votes_user_${userId}`;
  }

  // Incarca voturile userului curent din localStorage
  private loadVotes(userId: number): Record<string, VoteState> {
    const saved = localStorage.getItem(this.getStorageKey(userId));
    return saved ? JSON.parse(saved) : {};
  }

  // Salveaza voturile userului curent
  private saveVotes(userId: number, votes: Record<string, VoteState>): void {
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(votes));
    localStorage.setItem(this.scoreKey, JSON.stringify(this.scores));
  }

  getKey(type: 'post' | 'comment', id: number): string {
    return `${type}_${id}`;
  }

  getState(type: 'post' | 'comment', id: number, currentUserId?: number): VoteState {
    if (!currentUserId) {
      return { upvotes: 0, downvotes: 0, userVote: null };
    }
    const votes = this.loadVotes(currentUserId);
    const key = this.getKey(type, id);
    if (!votes[key]) {
      votes[key] = { upvotes: 0, downvotes: 0, userVote: null };
    }
    return votes[key];
  }

  getVoteCount(type: 'post' | 'comment', id: number, currentUserId?: number): number {
    // Numara voturile tuturor userilor pentru acest item
    // Scaneaza toate cheile de tip fb_votes_user_* din localStorage
    let upvotes = 0;
    let downvotes = 0;
    const key = this.getKey(type, id);
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('fb_votes_user_')) {
        try {
          const userVotes: Record<string, VoteState> = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (userVotes[key]) {
            upvotes += userVotes[key].upvotes;
            downvotes += userVotes[key].downvotes;
          }
        } catch { /* ignora erori de parse */ }
      }
    }
    return upvotes - downvotes;
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
      return this.getVoteCount(type, id, currentUserId);
    }

    const votes = this.loadVotes(currentUserId);
    const key = this.getKey(type, id);
    if (!votes[key]) {
      votes[key] = { upvotes: 0, downvotes: 0, userVote: null };
    }
    const state = votes[key];
    const prevVote = state.userVote;

    // Toggle off daca dai acelasi vot
    if (prevVote === direction) {
      if (direction === 'UP') state.upvotes--;
      else state.downvotes--;
      state.userVote = null;
      this.updateScore(contentAuthorId, type, direction, 'remove');
    } else {
      // Sterge votul anterior
      if (prevVote === 'UP') {
        state.upvotes--;
        this.updateScore(contentAuthorId, type, 'UP', 'remove');
      } else if (prevVote === 'DOWN') {
        state.downvotes--;
        this.updateScore(contentAuthorId, type, 'DOWN', 'remove');
        this.scores[currentUserId] = (this.scores[currentUserId] || 0) + 1.5;
      }
      // Adauga noul vot
      if (direction === 'UP') state.upvotes++;
      else {
        state.downvotes++;
        this.scores[currentUserId] = (this.scores[currentUserId] || 0) - 1.5;
      }
      state.userVote = direction;
      this.updateScore(contentAuthorId, type, direction, 'add');
    }

    votes[key] = state;
    this.saveVotes(currentUserId, votes);
    return this.getVoteCount(type, id, currentUserId);
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
  }

  getUserScore(userId: number): number {
    return Math.round((this.scores[userId] || 0) * 10) / 10;
  }
}
