package com.mibazarvirtual.backend.chat;

import com.mibazarvirtual.backend.repository.MessageRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageRetentionScheduler {

    private static final int MESSAGE_RETENTION_DAYS = 7;

    private final MessageRepository messageRepository;

    @Transactional
    @Scheduled(cron = "0 0 3 * * *")
    public void deleteExpiredMessages() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(MESSAGE_RETENTION_DAYS);
        long deleted = messageRepository.deleteByCreatedAtBefore(cutoff);

        if (deleted > 0) {
            log.info("Deleted {} chat messages older than {} days", deleted, MESSAGE_RETENTION_DAYS);
        }
    }
}
