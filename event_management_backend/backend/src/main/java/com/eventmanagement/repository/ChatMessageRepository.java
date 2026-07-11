package com.eventmanagement.repository;

import com.eventmanagement.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import com.eventmanagement.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByEventIdOrderBySentAtAsc(Long eventId);
}
