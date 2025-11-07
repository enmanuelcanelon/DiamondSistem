-- =====================================================
-- MIGRACIÓN: Migrar playlist_url a playlist_urls (JSON)
-- Descripción: Convierte el campo único a un array JSON
-- =====================================================

-- 1. Agregar columna playlist_urls si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_urls'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_urls JSONB;
        
        COMMENT ON COLUMN ajustes_evento.playlist_urls IS 'Array de URLs de playlists externas (YouTube Music o Spotify)';
    END IF;
END $$;

-- 2. Migrar datos existentes de playlist_url a playlist_urls
UPDATE ajustes_evento
SET playlist_urls = CASE 
    WHEN playlist_url IS NOT NULL AND playlist_url != '' THEN
        jsonb_build_array(playlist_url)
    ELSE
        NULL
END
WHERE playlist_url IS NOT NULL AND playlist_url != '';

-- 3. Eliminar columna playlist_url (solo después de migrar)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        DROP COLUMN playlist_url;
    END IF;
END $$;

-- MIGRACIÓN: Migrar playlist_url a playlist_urls (JSON)
-- Descripción: Convierte el campo único a un array JSON
-- =====================================================

-- 1. Agregar columna playlist_urls si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_urls'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_urls JSONB;
        
        COMMENT ON COLUMN ajustes_evento.playlist_urls IS 'Array de URLs de playlists externas (YouTube Music o Spotify)';
    END IF;
END $$;

-- 2. Migrar datos existentes de playlist_url a playlist_urls
UPDATE ajustes_evento
SET playlist_urls = CASE 
    WHEN playlist_url IS NOT NULL AND playlist_url != '' THEN
        jsonb_build_array(playlist_url)
    ELSE
        NULL
END
WHERE playlist_url IS NOT NULL AND playlist_url != '';

-- 3. Eliminar columna playlist_url (solo después de migrar)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        DROP COLUMN playlist_url;
    END IF;
END $$;

-- MIGRACIÓN: Migrar playlist_url a playlist_urls (JSON)
-- Descripción: Convierte el campo único a un array JSON
-- =====================================================

-- 1. Agregar columna playlist_urls si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_urls'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_urls JSONB;
        
        COMMENT ON COLUMN ajustes_evento.playlist_urls IS 'Array de URLs de playlists externas (YouTube Music o Spotify)';
    END IF;
END $$;

-- 2. Migrar datos existentes de playlist_url a playlist_urls
UPDATE ajustes_evento
SET playlist_urls = CASE 
    WHEN playlist_url IS NOT NULL AND playlist_url != '' THEN
        jsonb_build_array(playlist_url)
    ELSE
        NULL
END
WHERE playlist_url IS NOT NULL AND playlist_url != '';

-- 3. Eliminar columna playlist_url (solo después de migrar)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        DROP COLUMN playlist_url;
    END IF;
END $$;













