import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { Post, Tag } from '../../models/models';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss']
})
export class PostFormComponent implements OnInit {
  isEdit = false;
  postId: number | null = null;
  loading = false;
  submitting = false;

  title = '';
  content = '';
  tagInput = '';
  selectedTags: string[] = [];
  availableTags: Tag[] = [];
  imageFile: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;
  uploadingImage = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.postService.getAllTags().subscribe(tags => this.availableTags = tags);

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.postId = Number(id);
      this.loading = true;
      this.postService.getPostById(this.postId).subscribe({
        next: post => {
          this.title = post.title;
          this.content = post.content;
          this.selectedTags = post.tags.map(t => t.name);
          this.existingImageUrl = post.imageUrl || null;
          this.loading = false;
        },
        error: () => { this.loading = false; alert('Nu s-a putut încărca postarea.'); }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = e.target?.result as string;
      reader.readAsDataURL(this.imageFile);
    }
  }

  addTag(): void {
    const tag = this.tagInput.trim().toLowerCase();
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  addExistingTag(tag: Tag): void {
    if (!this.selectedTags.includes(tag.name)) {
      this.selectedTags.push(tag.name);
    }
  }

  async submit(): Promise<void> {
    const currentUser = this.userService.currentUser;
    if (!currentUser) { alert('Nu ești autentificat!'); return; }
    if (!this.title.trim()) { alert('Titlul este obligatoriu.'); return; }
    if (!this.content.trim()) { alert('Conținutul este obligatoriu.'); return; }
    if (this.selectedTags.length === 0) { alert('Adaugă cel puțin un tag.'); return; }

    this.submitting = true;
    let imageUrl = this.existingImageUrl || undefined;

    // Upload image if selected
    if (this.imageFile) {
      this.uploadingImage = true;
      try {
        imageUrl = await this.uploadImage(this.imageFile);
      } catch {
        alert('Eroare la încărcarea imaginii.');
        this.submitting = false;
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }

    if (this.isEdit && this.postId) {
      this.postService.updatePost(this.postId, this.title, this.content, currentUser.id).subscribe({
        next: () => this.router.navigate(['/posts', this.postId]),
        error: () => { this.submitting = false; alert('Eroare la editarea postării.'); }
      });
    } else {
      this.postService.createPost({
        title: this.title,
        content: this.content,
        authorId: currentUser.id,
        imageUrl: imageUrl || undefined,
        tags: this.selectedTags
      }).subscribe({
        next: post => this.router.navigate(['/posts', post.id]),
        error: () => { this.submitting = false; alert('Eroare la crearea postării.'); }
      });
    }
  }

  private uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      fetch('http://localhost:8080/api/images/upload', {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => data.url ? resolve(data.url) : reject(data))
        .catch(reject);
    });
  }
}
