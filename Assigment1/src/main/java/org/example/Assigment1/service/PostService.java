package org.example.Assigment1.service;

import org.example.Assigment1.entity.Comment;
import org.example.Assigment1.entity.Post;
import org.example.Assigment1.entity.PostStatus;
import org.example.Assigment1.entity.User;
import org.example.Assigment1.repository.CommentRepository;
import org.example.Assigment1.repository.PostRepository;
import org.example.Assigment1.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional(readOnly = true)
    public List<Post> getAllPosts() {
        return postRepository.findAllWithDetails();
    }

    @Transactional(readOnly = true)
    public Post getPostById(Long id) {
        Post post = postRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + id));
        post.getComments().size();
        post.getTags().size();
        return post;
    }

    public Post createPost(String title, String content, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorId));
        Post post = new Post(title, content, author);
        return postRepository.save(post);
    }

    public Post updatePost(Long id, String title, String content, PostStatus status) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + id));
        if (title != null && !title.isBlank()) post.setTitle(title);
        if (content != null && !content.isBlank()) post.setContent(content);
        if (status != null) post.setStatus(status);
        postRepository.save(post);
        return postRepository.findByIdWithDetails(id).orElse(post);
    }

    public void deletePost(Long id) {
        if (!postRepository.existsById(id)) {
            throw new NoSuchElementException("Post not found: " + id);
        }
        postRepository.deleteById(id);
    }

    public Comment addComment(Long postId, Long authorId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + postId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorId));
        Comment comment = new Comment(content, post, author);
        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<Comment> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    public Comment updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("Comment not found: " + commentId));
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new NoSuchElementException("Comment not found: " + commentId);
        }
        commentRepository.deleteById(commentId);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByStatus(PostStatus status) {
        return postRepository.findByStatus(status);
    }



    // Creare post cu imagine optionala
    public Post createPost(String title, String content, Long authorId, String imageUrl) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorId));
        Post post = new Post(title, content, author);
        if (imageUrl != null && !imageUrl.isBlank()) {
            post.setImageUrl(imageUrl);
        }
        return postRepository.save(post);
    }

    // Cauta dupa titlu SAU dupa username autor
    @Transactional(readOnly = true)
    public List<Post> searchPosts(String keyword) {
        return postRepository.searchByTitleOrAuthor(keyword);
    }
}