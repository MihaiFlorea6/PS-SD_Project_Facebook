package org.example.Assigment1.repository;

import org.example.Assigment1.entity.Post;
import org.example.Assigment1.entity.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author ORDER BY p.createdAt DESC, p.id DESC")
    List<Post> findAllWithDetails();


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author WHERE p.status = :status ORDER BY p.createdAt DESC, p.id DESC")
    List<Post> findByStatus(@Param("status") PostStatus status);


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author a " +
            "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY p.createdAt DESC, p.id DESC")
    List<Post> searchByTitleOrAuthor(@Param("keyword") String keyword);


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author WHERE p.id = :id")
    Optional<Post> findByIdWithDetails(@Param("id") Long id);


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author JOIN p.tags t WHERE LOWER(t.name) = LOWER(:tagName) ORDER BY p.createdAt DESC, p.id DESC")
    List<Post> findByTagName(@Param("tagName") String tagName);


    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.author WHERE p.author.id = :authorId ORDER BY p.createdAt DESC, p.id DESC")
    List<Post> findByAuthorId(@Param("authorId") Long authorId);
}