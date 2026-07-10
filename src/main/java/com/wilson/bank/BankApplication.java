package com.wilson.bank;

import com.wilson.bank.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BankApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(UserService userService) {
        return (args) -> {
            try {
                if (userService.getAllUsers().isEmpty()) {
                    // Seed default Employer
                    userService.registerUser("MGR101", "Wilson Employer", "EMPLOYER", "admin", 120000.00);
                    // Seed default Employee
                    userService.registerUser("EMP101", "John Employee", "EMPLOYEE", "password", 60000.00);
                    System.out.println("Default employer (MGR101/admin) and employee (EMP101/password) seeded successfully!");
                }
            } catch (Exception e) {
                System.err.println("Error seeding default data: " + e.getMessage());
            }
        };
    }
}
