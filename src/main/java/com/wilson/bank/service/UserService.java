package com.wilson.bank.service;

import com.wilson.bank.entity.User;
import com.wilson.bank.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByUserId(String userId) {
        return userRepository.findByUserId(userId).orElse(null);
    }

    public User registerUser(String userId, String name, String role, String rawPassword, Double payroll) {
        if (userRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("User already exists with ID: " + userId);
        }
        String passwordHash = hashPassword(rawPassword != null ? rawPassword : userId);
        User user = new User(userId, name, role.toUpperCase(), passwordHash, payroll);
        return userRepository.save(user);
    }

    public User authenticate(String userId, String rawPassword) {
        User user = getUserByUserId(userId);
        if (user == null || rawPassword == null) {
            return null;
        }
        String computedHash = hashPassword(rawPassword);
        if (user.getPasswordHash().equals(computedHash)) {
            return user;
        }
        return null;
    }

    public User updatePayroll(String userId, Double newPayroll) {
        User user = getUserByUserId(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        user.setPayroll(newPayroll);
        return userRepository.save(user);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
