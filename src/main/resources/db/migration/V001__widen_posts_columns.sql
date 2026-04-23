-- Widen the posts table so users can write real blog posts.
--
-- Hibernate's ddl-auto=update will add new columns but refuses to alter
-- existing column types (to protect data), so the original VARCHAR(1200)
-- cap on `content` stayed in place even after the entity was changed to TEXT.
-- This is idempotent — safe to run multiple times.
--
-- The app also runs these same ALTERs automatically at startup via
-- com.example.dsa.community.PostSchemaMigration, so you only need this file
-- if you prefer to migrate by hand or are using a migration tool (Flyway,
-- Liquibase, psql, etc.).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'content'
          AND data_type = 'character varying'
    ) THEN
        ALTER TABLE posts ALTER COLUMN content TYPE TEXT;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'title'
          AND data_type = 'character varying'
          AND character_maximum_length < 500
    ) THEN
        ALTER TABLE posts ALTER COLUMN title TYPE VARCHAR(500);
    END IF;
END $$;
