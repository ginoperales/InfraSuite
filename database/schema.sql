-- ============================================================
-- INFRASUITE: SUPABASE DATABASE & STORAGE SETUP SCHEMA
-- Ejecuta este script en el SQL Editor de tu panel de Supabase
-- ============================================================

-- 1. Crear tabla 'budgets' para almacenar metadatos e índice ligero
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    cliente TEXT,
    fecha_base TEXT,
    grupo TEXT DEFAULT 'EDIFICACIONES',
    categoria TEXT DEFAULT 'Recientes',
    storage_url TEXT,
    storage_path TEXT,
    owner_id TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    link_access TEXT DEFAULT 'RESTRICTED',
    link_role TEXT DEFAULT 'VIEWER',
    is_local BOOLEAN DEFAULT false,
    synced_at BIGINT,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Habilitar RLS (Row Level Security) para seguridad opcional
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública/anon (permitir acceso si es el dueño o si tiene acceso por link)
CREATE POLICY "Permitir lectura de presupuestos" 
ON public.budgets FOR SELECT 
USING (true);

-- Política de inserción y actualización
CREATE POLICY "Permitir insercion y actualizacion de presupuestos" 
ON public.budgets FOR ALL 
USING (true) 
WITH CHECK (true);

-- Habilitar réplica en tiempo real (Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;

-- 2. Crear Bucket de Storage 'budgets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('budgets', 'budgets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política para permitir acceso público de lectura y subida al bucket 'budgets'
CREATE POLICY "Acceso publico lectura de presupuestos JSON"
ON storage.objects FOR SELECT
USING (bucket_id = 'budgets');

CREATE POLICY "Acceso publico subida de presupuestos JSON"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'budgets');

CREATE POLICY "Acceso publico actualizacion de presupuestos JSON"
ON storage.objects FOR UPDATE
USING (bucket_id = 'budgets');

CREATE POLICY "Acceso publico eliminacion de presupuestos JSON"
ON storage.objects FOR DELETE
USING (bucket_id = 'budgets');
