-- =====================================================
-- MIGRACIÓN: Agregar campo playlist_url a ajustes_evento
-- Descripción: Permite guardar URLs de playlists externas (YouTube/Spotify)
-- =====================================================

-- Agregar columna playlist_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_url VARCHAR(500);
        
        COMMENT ON COLUMN ajustes_evento.playlist_url IS 'URL de playlist externa (YouTube Music o Spotify)';
    END IF;
END $$;

-- MIGRACIÓN: Agregar campo playlist_url a ajustes_evento
-- Descripción: Permite guardar URLs de playlists externas (YouTube/Spotify)
-- =====================================================

-- Agregar columna playlist_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_url VARCHAR(500);
        
        COMMENT ON COLUMN ajustes_evento.playlist_url IS 'URL de playlist externa (YouTube Music o Spotify)';
    END IF;
END $$;

-- MIGRACIÓN: Agregar campo playlist_url a ajustes_evento
-- Descripción: Permite guardar URLs de playlists externas (YouTube/Spotify)
-- =====================================================

-- Agregar columna playlist_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ajustes_evento' 
        AND column_name = 'playlist_url'
    ) THEN
        ALTER TABLE ajustes_evento 
        ADD COLUMN playlist_url VARCHAR(500);
        
        COMMENT ON COLUMN ajustes_evento.playlist_url IS 'URL de playlist externa (YouTube Music o Spotify)';
    END IF;
END $$;













