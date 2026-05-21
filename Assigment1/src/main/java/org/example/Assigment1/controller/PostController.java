package org.example.Assigment1.controller;

import org.example.Assigment1.entity.Comment;
import org.example.Assigment1.entity.Post;
import org.example.Assigment1.entity.PostStatus;
import org.example.Assigment1.entity.Tag;
import org.example.Assigment1.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }



    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body) {
        try {
            String title = (String) body.get("title");
            String content = (String) body.get("content");
            Long authorId = Long.valueOf(body.get("authorId").toString());
            String imageUrl = body.get("imageUrl") != null ? (String) body.get("imageUrl") : null;

            // Tag-uri: lista de stringuri (optionale)
            List<String> tagNames = null;
            if (body.get("tags") instanceof List) {
                tagNames = ((List<?>) body.get("tags")).stream()
                        .map(Object::toString)
                        .toList();
            }

            Post post = postService.createPost(title, content, authorId, imageUrl, tagNames);
            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long authorId) {

        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(postService.searchPosts(search));
        }
        if (tag != null && !tag.isBlank()) {
            return ResponseEntity.ok(postService.getPostsByTag(tag));
        }
        if (authorId != null) {
            return ResponseEntity.ok(postService.getPostsByAuthor(authorId));
        }
        if (status != null) {
            return ResponseEntity.ok(postService.getPostsByStatus(PostStatus.valueOf(status.toUpperCase())));
        }
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(postService.getPostById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String title = (String) body.get("title");
            String content = (String) body.get("content");
            PostStatus status = body.get("status") != null
                    ? PostStatus.valueOf(body.get("status").toString().toUpperCase()) : null;


            Long requestingUserId = body.get("userId") != null
                    ? Long.valueOf(body.get("userId").toString()) : null;

            Post updated = postService.updatePost(id, title, content, status, requestingUserId);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id,
                                        @RequestParam(required = false) Long userId) {
        try {
            postService.deletePost(id, userId);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/{id}/lock")
    public ResponseEntity<?> lockPost(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            Post locked = postService.lockPost(id, userId);
            return ResponseEntity.ok(locked);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }



    @GetMapping("/tags")
    public ResponseEntity<List<Tag>> getAllTags() {
        return ResponseEntity.ok(postService.getAllTags());
    }



    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long postId, @RequestBody Map<String, Object> body) {
        try {
            Long authorId = Long.valueOf(body.get("authorId").toString());
            String content = (String) body.get("content");
            Comment comment = postService.addComment(postId, authorId, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.getCommentsByPost(postId));
    }

    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long postId,
                                           @PathVariable Long commentId,
                                           @RequestBody Map<String, Object> body) {
        try {
            String content = (String) body.get("content");
            Long requestingUserId = body.get("userId") != null
                    ? Long.valueOf(body.get("userId").toString()) : null;
            Comment updated = postService.updateComment(commentId, content, requestingUserId);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long postId,
                                           @PathVariable Long commentId,
                                           @RequestParam(required = false) Long userId) {
        try {
            postService.deleteComment(commentId, userId);
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}