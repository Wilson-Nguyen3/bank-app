package com.wilson.bank.controller;

import com.wilson.bank.entity.User;
import com.wilson.bank.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class BankController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String name,
            @RequestParam String id,
            @RequestParam String role,
            @RequestParam String password,
            @RequestParam(required = false) Double payroll) {
        try {
            Double initialPayroll = payroll != null ? payroll : 0.0;
            User registered = userService.registerUser(id, name, role, password, initialPayroll);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully!");
            response.put("userId", registered.getUserId());
            response.put("name", registered.getName());
            response.put("role", registered.getRole());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestParam String id,
            @RequestParam String password) {
        
        User authenticated = userService.authenticate(id, password);
        if (authenticated != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("userId", authenticated.getUserId());
            response.put("name", authenticated.getName());
            response.put("role", authenticated.getRole());
            response.put("payroll", authenticated.getPayroll());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Invalid credentials.");
        }
    }

    @GetMapping("/employees")
    public ResponseEntity<?> getEmployees(@RequestParam String requesterId) {
        User requester = userService.getUserByUserId(requesterId);
        if (requester == null || !requester.getRole().equals("EMPLOYER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Access restricted to Employers only.");
        }
        
        List<Map<String, Object>> employeeList = userService.getAllUsers().stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", user.getUserId());
            map.put("name", user.getName());
            map.put("role", user.getRole());
            map.put("payroll", user.getPayroll());
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(employeeList);
    }

    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile(@RequestParam String userId) {
        User user = userService.getUserByUserId(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: User not found.");
        }
        Map<String, Object> map = new HashMap<>();
        map.put("userId", user.getUserId());
        map.put("name", user.getName());
        map.put("role", user.getRole());
        map.put("payroll", user.getPayroll());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/payroll/update")
    public ResponseEntity<?> updatePayroll(
            @RequestParam String requesterId,
            @RequestParam String targetId,
            @RequestParam Double newPayroll) {
        
        User requester = userService.getUserByUserId(requesterId);
        if (requester == null || !requester.getRole().equals("EMPLOYER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Access restricted to Employers only.");
        }
        
        try {
            User updated = userService.updatePayroll(targetId, newPayroll);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Payroll updated successfully!");
            response.put("userId", updated.getUserId());
            response.put("name", updated.getName());
            response.put("payroll", updated.getPayroll());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/public/roster-count")
    public ResponseEntity<?> getRosterCount() {
        try {
            int count = userService.getAllUsers().size();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.ok(0);
        }
    }
}
