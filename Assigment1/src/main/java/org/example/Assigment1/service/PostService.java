package org.example.Assigment1.service;

import org.example.Assigment1.entity.*;
import org.example.Assigment1.repository.CommentRepository;
import org.example.Assigment1.repository.PostRepository;
import org.example.Assigment1.repository.TagRepository;
import org.example.Assigment1.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TagRepository tagRepository;

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       CommentRepository commentRepository,
                       TagRepository tagRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.tagRepository = tagRepository;
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

    // Creare post cu tag-uri optionale si imagine optionala
    public Post createPost(String title, String content, Long authorId, String imageUrl, List<String> tagNames) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorId));

        Post post = new Post(title, content, author);
        post.setStatus(PostStatus.JUST_POSTED);

        if (imageUrl != null && !imageUrl.isBlank()) {
            post.setImageUrl(imageUrl);
        }

        // Procesare tag-uri: creeaza daca nu exista
        if (tagNames != null && !tagNames.isEmpty()) {
            Set<Tag> tags = tagNames.stream()
                    .map(name -> name.trim().toLowerCase())
                    .filter(name -> !name.isBlank())
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> tagRepository.save(new Tag(name))))
                    .collect(Collectors.toSet());
            post.setTags(tags);
        }

        return postRepository.save(post);
    }

    // Overload pentru compatibilitate cu metodele vechi (fara imageUrl si tags)
    public Post createPost(String title, String content, Long authorId) {
        return createPost(title, content, authorId, null, null);
    }

    // Overload cu imageUrl dar fara tags
    public Post createPost(String title, String content, Long authorId, String imageUrl) {
        return createPost(title, content, authorId, imageUrl, null);
    }

    // Update post — verifica autor
    public Post updatePost(Long id, String title, String content, PostStatus status, Long requestingUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + id));

        // Verificare autor
        if (requestingUserId != null && !post.getAuthor().getId().equals(requestingUserId)) {
            throw new SecurityException("You can only edit your own posts");
        }

        if (title != null && !title.isBlank()) post.setTitle(title);
        if (content != null && !content.isBlank()) post.setContent(content);
        if (status != null) post.setStatus(status);

        postRepository.save(post);
        return postRepository.findByIdWithDetails(id).orElse(post);
    }

    // Overload fara verificare autor (backward compat)
    public Post updatePost(Long id, String title, String content, PostStatus status) {
        return updatePost(id, title, content, status, null);
    }

    // Delete post — verifica autor
    public void deletePost(Long id, Long requestingUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + id));

        if (requestingUserId != null && !post.getAuthor().getId().equals(requestingUserId)) {
            throw new SecurityException("You can only delete your own posts");
        }

        postRepository.deleteById(id);
    }

    public void deletePost(Long id) {
        deletePost(id, null);
    }

    // Adauga comentariu si actualizeaza statusul postarii la FIRST_REACTIONS
    public Comment addComment(Long postId, Long authorId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + postId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorId));

        Comment comment = new Comment(content, post, author);
        Comment saved = commentRepository.save(comment);

        // Daca postul e JUST_POSTED si acum are comentarii -> FIRST_REACTIONS
        if (post.getStatus() == PostStatus.JUST_POSTED) {
            post.setStatus(PostStatus.FIRST_REACTIONS);
            postRepository.save(post);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Comment> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    // Update comentariu — verifica autor
    public Comment updateComment(Long commentId, String content, Long requestingUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("Comment not found: " + commentId));

        if (requestingUserId != null && !comment.getAuthor().getId().equals(requestingUserId)) {
            throw new SecurityException("You can only edit your own comments");
        }

        comment.setContent(content);
        return commentRepository.save(comment);
    }

    public Comment updateComment(Long commentId, String content) {
        return updateComment(commentId, content, null);
    }

    // Delete comentariu — verifica autor; autorul postului poate sterge orice comentariu
    public void deleteComment(Long commentId, Long requestingUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("Comment not found: " + commentId));

        if (requestingUserId != null) {
            boolean isCommentAuthor = comment.getAuthor().getId().equals(requestingUserId);
            boolean isPostAuthor = comment.getPost().getAuthor().getId().equals(requestingUserId);
            if (!isCommentAuthor && !isPostAuthor) {
                throw new SecurityException("You can only delete your own comments");
            }
        }

        commentRepository.deleteById(commentId);
    }

    public void deleteComment(Long commentId) {
        deleteComment(commentId, null);
    }

    // Blocheaza comentariile (seteaza OUTDATED) — doar autorul postului
    public Post lockPost(Long postId, Long requestingUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found: " + postId));

        if (!post.getAuthor().getId().equals(requestingUserId)) {
            throw new SecurityException("Only the post author can lock it");
        }

        post.setStatus(PostStatus.OUTDATED);
        return postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByStatus(PostStatus status) {
        return postRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Post> searchPosts(String keyword) {
        return postRepository.searchByTitleOrAuthor(keyword);
    }

    // Filtrare dupa tag
    @Transactional(readOnly = true)
    public List<Post> getPostsByTag(String tagName) {
        return postRepository.findByTagName(tagName);
    }

    // Filtrare dupa autor
    @Transactional(readOnly = true)
    public List<Post> getPostsByAuthor(Long authorId) {
        return postRepository.findByAuthorId(authorId);
    }

    // Returneaza toate tag-urile existente
    @Transactional(readOnly = true)
    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }
}