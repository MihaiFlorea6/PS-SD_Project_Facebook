package org.example.Assigment1.repository;

import org.example.Assigment1.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<Comment> findByAuthorId(Long authorId);

    void deleteByPostId(Long postId);
}