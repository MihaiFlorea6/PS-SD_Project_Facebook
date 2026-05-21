package org.example.Assigment1;

import org.example.Assigment1.entity.User;
import org.example.Assigment1.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner{
    private final UserService userService;

    public DatabaseSeeder(UserService userService) {
        this.userService = userService;
    }
    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- INITIERE TESTARE IN CONSOLA ---");

        try{
            User testUser = userService.createUser("studentTest", "student@test.com", "parola123");
            System.out.println("[SUCCES] Utilizator creat: " + testUser.getUsername() + " cu ID-ul " + testUser.getId());

            int totalUsers = userService.getAllUsers().size();
            System.out.println("[INFO] Număr total utilizatori în DB: " + totalUsers);

        } catch(IllegalArgumentException e){
            System.out.println("[INFO] Datele de test există deja în baza de date. (" + e.getMessage() + ")");
        }

        System.out.println("--- FINALIZARE TESTARE IN CONSOLA ---");

    }
}