package com.eventmanagement.service;

import com.eventmanagement.dto.CreateUserRequest;
import com.eventmanagement.dto.UserResponse;
import com.eventmanagement.entity.User;
import com.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse createUser(CreateUserRequest request) {
        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(request.password()) // kasnije zameniti BCrypt encoderom
                .role(request.role())
                .build();

        return UserResponse.from(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}
