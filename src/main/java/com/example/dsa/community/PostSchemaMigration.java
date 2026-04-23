package com.example.dsa.community;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-off schema fix: widen {@code posts.content} from VARCHAR(1200) → TEXT
 * and {@code posts.title} from VARCHAR(200) → VARCHAR(500).
 *
 * Hibernate's {@code ddl-auto=update} will happily add new columns but
 * deliberately refuses to alter existing column types (to avoid truncating
 * data). That left older deployments stuck with the original
 * VARCHAR(1200) cap and threw "value too long" on long posts.
 *
 * This runs at startup, is idempotent (no-op if the columns are already
 * the right type thanks to the information_schema guards), and only
 * targets Postgres — the project's configured dialect.
 */
@Component
@Order(0)
public class PostSchemaMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PostSchemaMigration.class);
    private final JdbcTemplate jdbc;

    public PostSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        // Runs a Postgres-specific DO block. On non-Postgres backends
        // (H2 in tests, etc.) the statement will fail syntactically and
        // the catch below just logs it — the app still boots fine.
        try {
            jdbc.execute(
                "DO $$ " +
                "BEGIN " +
                "    IF EXISTS (" +
                "        SELECT 1 FROM information_schema.columns " +
                "        WHERE table_name = 'posts' AND column_name = 'content' " +
                "          AND data_type = 'character varying'" +
                "    ) THEN " +
                "        ALTER TABLE posts ALTER COLUMN content TYPE TEXT; " +
                "    END IF; " +
                "    IF EXISTS (" +
                "        SELECT 1 FROM information_schema.columns " +
                "        WHERE table_name = 'posts' AND column_name = 'title' " +
                "          AND data_type = 'character varying' " +
                "          AND character_maximum_length < 500" +
                "    ) THEN " +
                "        ALTER TABLE posts ALTER COLUMN title TYPE VARCHAR(500); " +
                "    END IF; " +
                "END $$;"
            );
            log.info("PostSchemaMigration ran (posts.content → TEXT, posts.title → VARCHAR(500) if needed)");
        } catch (Exception e) {
            // Never fail startup. Worst case: the user keeps hitting the
            // existing error and has to migrate manually.
            log.warn("PostSchemaMigration skipped: {}", e.getMessage());
        }
    }
}
