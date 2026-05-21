package org.example.Assigment1.repository;

import org.example.Assigment1.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {


    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}