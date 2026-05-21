package org.example.Assigment1;

import org.example.Assigment1.entity.*;
import org.example.Assigment1.repository.CommentRepository;
import org.example.Assigment1.repository.PostRepository;
import org.example.Assigment1.repository.TagRepository;
import org.example.Assigment1.repository.UserRepository;
import org.example.Assigment1.service.PostService;
import org.example.Assigment1.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class Assigment1ApplicationTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private UserService userService;

    @InjectMocks
    private PostService postService;

    // ── Utilizatori din seed-ul bazei de date ─────────────────────────────────

    private User alice;
    private User bob;
    private User charlie;
    private User diana;
    private User eve;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Replicam exact utilizatorii din DB seed
        alice   = makeUser(1L, "alice",   "alice@example.com");
        bob     = makeUser(2L, "bob",     "bob@example.com");
        charlie = makeUser(3L, "charlie", "charlie@example.com");
        diana   = makeUser(4L, "diana",   "diana@example.com");
        eve     = makeUser(5L, "eve",     "eve@example.com");
    }

    private User makeUser(Long id, String username, String email) {
        User u = new User(username, email, "hashed_password");
        u.setId(id);
        return u;
    }

    private Post makePost(Long id, String title, String content, User author) {
        Post p = new Post(title, content, author);
        p.setId(id);
        p.setStatus(PostStatus.JUST_POSTED);
        return p;
    }

    // ════════════════════════════════════════════════════════════════════════════
    //  TESTE USER SERVICE
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    void testCreateUser_Success_Alice() {
        when(userRepository.existsByUsername("alice2")).thenReturn(false);
        when(userRepository.existsByEmail("alice2@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        User result = userService.createUser("alice2", "alice2@example.com", "parola123");

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("alice2", result.getUsername());
        // Parola trebuie sa fie criptata (BCrypt incepe cu $2a$)
        assertTrue(result.getPassword().startsWith("$2a$"),
                "Parola trebuie salvata criptat cu BCrypt!");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testCreateUser_ThrowsException_WhenUsernameExists_Bob() {
        when(userRepository.existsByUsername("bob")).thenReturn(true);

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                userService.createUser("bob", "bob_new@example.com", "parola"));

        assertEquals("Username already taken: bob", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testCreateUser_ThrowsException_WhenEmailExists_Charlie() {
        when(userRepository.existsByUsername("charlie_new")).thenReturn(false);
        when(userRepository.existsByEmail("charlie@example.com")).thenReturn(true);

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                userService.createUser("charlie_new", "charlie@example.com", "parola"));

        assertEquals("Email already in use: charlie@example.com", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testGetUserById_Success_Diana() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(diana));

        User result = userService.getUserById(4L);

        assertNotNull(result);
        assertEquals("diana", result.getUsername());
        assertEquals("diana@example.com", result.getEmail());
    }

    @Test
    void testGetUserById_ThrowsException_WhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> userService.getUserById(99L));
    }

    @Test
    void testUpdateUser_Success_Eve() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(eve));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateUser(5L, "eve_updated", "eve_new@example.com");

        assertEquals("eve_updated", result.getUsername());
        assertEquals("eve_new@example.com", result.getEmail());
    }

    @Test
    void testDeleteUser_ThrowsException_WhenNotFound() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () -> userService.deleteUser(99L));
        verify(userRepository, never()).deleteById(any());
    }

    // ════════════════════════════════════════════════════════════════════════════
    //  TESTE POST SERVICE
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    void testCreatePost_Success_AliceAuthor() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(tagRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        Post result = postService.createPost(
                "How do I configure Spring Boot with MySQL?",
                "I am trying to connect my Spring Boot application...",
                1L, null, List.of("java", "spring-boot", "database"));

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("How do I configure Spring Boot with MySQL?", result.getTitle());
        assertEquals(PostStatus.JUST_POSTED, result.getStatus(),
                "Un post nou trebuie sa aiba statusul JUST_POSTED!");
        assertEquals(alice.getId(), result.getAuthor().getId());
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    void testCreatePost_ThrowsException_WhenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () ->
                postService.createPost("Title", "Content", 99L, null, null));

        verify(postRepository, never()).save(any(Post.class));
    }

    @Test
    void testCreatePost_WithTags_CreatesNewTagsIfNotExist() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(tagRepository.findByName("java")).thenReturn(Optional.empty());
        when(tagRepository.findByName("spring-boot")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> {
            Tag t = inv.getArgument(0);
            return t;
        });
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(11L);
            return p;
        });

        Post result = postService.createPost(
                "Best practices for JPA entity mapping",
                "When designing entity classes...",
                2L, null, List.of("java", "spring-boot"));

        assertNotNull(result);
        assertEquals(2, result.getTags().size(), "Postul trebuie sa aiba 2 tag-uri!");
        // Tagurile noi au fost create
        verify(tagRepository, times(2)).save(any(Tag.class));
    }

    @Test
    void testCreatePost_WithExistingTag_DoesNotDuplicate() {
        Tag existingTag = new Tag("java");
        existingTag.setId(1L);

        when(userRepository.findById(3L)).thenReturn(Optional.of(charlie));
        when(tagRepository.findByName("java")).thenReturn(Optional.of(existingTag));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(12L);
            return p;
        });

        Post result = postService.createPost(
                "How to implement pagination?",
                "I have a repository extending JpaRepository...",
                3L, null, List.of("java"));

        assertNotNull(result);
        assertEquals(1, result.getTags().size());
        // Tagul existent NU se re-salveaza
        verify(tagRepository, never()).save(any(Tag.class));
    }

    @Test
    void testAddComment_ChangesStatusToFirstReactions() {
        Post post = makePost(1L,
                "How do I configure Spring Boot?",
                "Connection refused errors...", alice);
        post.setStatus(PostStatus.JUST_POSTED);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        Comment result = postService.addComment(1L, 2L,
                "Make sure your MySQL service is actually running.");

        assertNotNull(result);
        assertEquals(PostStatus.FIRST_REACTIONS, post.getStatus(),
                "Dupa primul comentariu, statusul trebuie sa fie FIRST_REACTIONS!");
        verify(postRepository, times(1)).save(post);
    }

    @Test
    void testAddComment_StatusStaysFirstReactions_WhenAlreadyChanged() {
        Post post = makePost(1L, "Title", "Content", alice);
        post.setStatus(PostStatus.FIRST_REACTIONS);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findById(3L)).thenReturn(Optional.of(charlie));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(101L);
            return c;
        });

        postService.addComment(1L, 3L, "Also double-check the port.");

        // Status nu se mai schimba (era deja FIRST_REACTIONS)
        assertEquals(PostStatus.FIRST_REACTIONS, post.getStatus());
        // postRepository.save nu mai e apelat pentru schimbare de status
        verify(postRepository, never()).save(any(Post.class));
    }

    @Test
    void testLockPost_ChangesStatusToOutdated_ByAuthor() {
        Post post = makePost(3L,
                "Spring Boot REST API returns 404",
                "I created a @RestController...", alice);
        post.setStatus(PostStatus.FIRST_REACTIONS);

        when(postRepository.findById(3L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        Post locked = postService.lockPost(3L, 1L); // alice = autorul

        assertEquals(PostStatus.OUTDATED, locked.getStatus(),
                "Dupa blocare, statusul trebuie sa fie OUTDATED!");
    }

    @Test
    void testLockPost_ThrowsException_WhenNotAuthor() {
        Post post = makePost(3L, "Title", "Content", alice); // autor = alice (id=1)

        when(postRepository.findById(3L)).thenReturn(Optional.of(post));

        // Bob (id=2) incearca sa blocheze postul lui Alice
        assertThrows(SecurityException.class, () ->
                postService.lockPost(3L, 2L));
    }

    @Test
    void testDeletePost_ThrowsException_WhenNotAuthor() {
        Post post = makePost(1L, "Title", "Content", alice); // autor = alice (id=1)

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        // Bob (id=2) incearca sa stearga postul lui Alice
        assertThrows(SecurityException.class, () ->
                postService.deletePost(1L, 2L));

        verify(postRepository, never()).deleteById(any());
    }

    @Test
    void testDeletePost_Success_ByAuthor() {
        Post post = makePost(1L, "Title", "Content", alice);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        doNothing().when(postRepository).deleteById(1L);

        assertDoesNotThrow(() -> postService.deletePost(1L, 1L)); // alice sterge propriul post
        verify(postRepository, times(1)).deleteById(1L);
    }

    @Test
    void testUpdateComment_ThrowsException_WhenNotAuthor() {
        Post post = makePost(1L, "Title", "Content", alice);
        Comment comment = new Comment("Make sure MySQL is running", post, bob); // autor = bob (id=2)
        comment.setId(10L);

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        // Charlie (id=3) incearca sa editeze comentariul lui Bob
        assertThrows(SecurityException.class, () ->
                postService.updateComment(10L, "Continut nou", 3L));

        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void testUpdateComment_Success_ByAuthor() {
        Post post = makePost(1L, "Title", "Content", alice);
        Comment comment = new Comment("Make sure MySQL is running", post, bob);
        comment.setId(10L);

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        Comment updated = postService.updateComment(10L, "Continut actualizat", 2L); // bob isi editeaza comentariul

        assertEquals("Continut actualizat", updated.getContent());
        verify(commentRepository, times(1)).save(comment);
    }

    @Test
    void testDeleteComment_ByPostAuthor_Success() {
        Post post = makePost(1L, "Title", "Content", alice); // alice = autor post
        Comment comment = new Comment("Un comentariu", post, bob); // bob = autor comentariu
        comment.setId(20L);

        when(commentRepository.findById(20L)).thenReturn(Optional.of(comment));
        doNothing().when(commentRepository).deleteById(20L);

        // Alice (autoarea postului) poate sterge comentariul lui Bob
        assertDoesNotThrow(() -> postService.deleteComment(20L, 1L));
        verify(commentRepository, times(1)).deleteById(20L);
    }

    @Test
    void testGetPostsByTag_CallsRepository() {
        Post post1 = makePost(1L, "Spring Boot with MySQL", "Content 1", alice);
        Post post4 = makePost(4L, "Pagination in Spring", "Content 4", charlie);

        when(postRepository.findByTagName("java")).thenReturn(List.of(post1, post4));

        List<Post> result = postService.getPostsByTag("java");

        assertEquals(2, result.size());
        verify(postRepository, times(1)).findByTagName("java");
    }

    @Test
    void testGetPostsByAuthor_DianasPosts() {
        Post post5 = makePost(5L, "Understanding @Transactional", "Content 5", diana);
        Post post9 = makePost(9L, "Spring Security endpoint", "Content 9", diana);

        when(postRepository.findByAuthorId(4L)).thenReturn(List.of(post5, post9));

        List<Post> result = postService.getPostsByAuthor(4L);

        assertEquals(2, result.size());
        result.forEach(p -> assertEquals("diana", p.getAuthor().getUsername()));
    }

    @Test
    void testGetAllPosts_ReturnsAll() {
        when(postRepository.findAllWithDetails()).thenReturn(List.of(
                makePost(1L, "Post 1", "Content", alice),
                makePost(2L, "Post 2", "Content", bob),
                makePost(3L, "Post 3", "Content", alice),
                makePost(4L, "Post 4", "Content", charlie),
                makePost(5L, "Post 5", "Content", diana)
        ));

        List<Post> result = postService.getAllPosts();

        assertEquals(5, result.size());
    }
}