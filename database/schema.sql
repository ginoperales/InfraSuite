-- ============================================================
-- INFRASUITE: SUPABASE DATABASE & STORAGE FULL SETUP SCHEMA
-- Ejecuta este script en el SQL Editor de tu panel de Supabase
-- ============================================================

-- 1. Tabla 'budgets' (Presupuestos & Metadatos)
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
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura de presupuestos" ON public.budgets;
CREATE POLICY "Permitir lectura de presupuestos" ON public.budgets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion y actualizacion de presupuestos" ON public.budgets;
CREATE POLICY "Permitir insercion y actualizacion de presupuestos" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla 'companies' (Empresas)
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    ruc TEXT,
    estado TEXT DEFAULT 'activo'
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en empresas" ON public.companies;
CREATE POLICY "Permitir todo en empresas" ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabla 'users' (Usuarios)
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    id TEXT,
    empresa_id TEXT,
    nombre TEXT,
    email TEXT,
    role TEXT
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en usuarios" ON public.users;
CREATE POLICY "Permitir todo en usuarios" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabla 'licenses' (Licencias)
CREATE TABLE IF NOT EXISTS public.licenses (
    empresa_id TEXT PRIMARY KEY,
    id TEXT,
    plan TEXT,
    vencimiento TEXT
);
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en licencias" ON public.licenses;
CREATE POLICY "Permitir todo en licencias" ON public.licenses FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabla 'modules' (Módulos de InfraSuite)
CREATE TABLE IF NOT EXISTS public.modules (
    codigo TEXT PRIMARY KEY,
    id TEXT,
    nombre TEXT,
    "desc" TEXT,
    icon TEXT,
    activo BOOLEAN DEFAULT true,
    visible_landing BOOLEAN DEFAULT true
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en modulos" ON public.modules;
CREATE POLICY "Permitir todo en modulos" ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- 6. Tabla 'company_modules' (Relación Empresa - Módulos)
CREATE TABLE IF NOT EXISTS public.company_modules (
    id TEXT PRIMARY KEY,
    empresa_id TEXT,
    modulo_id TEXT
);
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en company_modules" ON public.company_modules;
CREATE POLICY "Permitir todo en company_modules" ON public.company_modules FOR ALL USING (true) WITH CHECK (true);

-- 7. Tabla 'logs' (Auditoría y Registros)
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    usuario TEXT,
    accion TEXT,
    detalle TEXT
);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en logs" ON public.logs;
CREATE POLICY "Permitir todo en logs" ON public.logs FOR ALL USING (true) WITH CHECK (true);

-- 8. Tabla 'plans' (Planes de Suscripción)
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    title TEXT,
    promo TEXT,
    "desc" TEXT,
    price TEXT,
    features TEXT,
    popular BOOLEAN DEFAULT false
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en plans" ON public.plans;
CREATE POLICY "Permitir todo en plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

-- 9. Tabla 'clients' (Clientes Destacados)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    logo TEXT
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en clients" ON public.clients;
CREATE POLICY "Permitir todo en clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Supabase Realtime para la tabla budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'budgets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
  END IF;
END $$;

-- 10. Bucket de Storage 'budgets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('budgets', 'budgets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso publico lectura de presupuestos JSON" ON storage.objects;
CREATE POLICY "Acceso publico lectura de presupuestos JSON" ON storage.objects FOR SELECT USING (bucket_id = 'budgets');
DROP POLICY IF EXISTS "Acceso publico subida de presupuestos JSON" ON storage.objects;
CREATE POLICY "Acceso publico subida de presupuestos JSON" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'budgets');
DROP POLICY IF EXISTS "Acceso publico actualizacion de presupuestos JSON" ON storage.objects;
CREATE POLICY "Acceso publico actualizacion de presupuestos JSON" ON storage.objects FOR UPDATE USING (bucket_id = 'budgets');
DROP POLICY IF EXISTS "Acceso publico eliminacion de presupuestos JSON" ON storage.objects;
CREATE POLICY "Acceso publico eliminacion de presupuestos JSON" ON storage.objects FOR DELETE USING (bucket_id = 'budgets');

-- ============================================================
-- DATOS INICIALES (SEED DATA)
-- ============================================================

INSERT INTO public.companies (id, nombre, ruc, estado) VALUES
('c1', 'Constructora Alfa S.A.', '20123456789', 'activo'),
('c2', 'Mecánica de Suelos Delta', '20987654321', 'activo'),
('c3', 'Consorcio Vial del Sur', '20456123789', 'suspendido')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (uid, id, empresa_id, nombre, email, role) VALUES
('u1', 'u1', 'c1', 'Ing. Carlos Mendoza', 'carlos@alfa.com', 'ADMIN'),
('u2', 'u2', 'c1', 'Diana Flores', 'diana@alfa.com', 'PROJECT_MANAGER'),
('u3', 'u3', 'c2', 'Ing. Sofia Rodriguez', 'sofia@delta.com', 'ENGINEER'),
('u4', 'u4', '', 'Super Administrador', 'superadmin@infrasuite.com', 'SUPER_ADMIN'),
('u5', 'u5', 'c3', 'Jorge Peralta', 'jorge@vialsur.com', 'VIEWER'),
('u6', 'u6', '', 'Super Google Admin', 'superadmin.google@gmail.com', 'SUPER_ADMIN'),
('u7', 'u7', '', 'Gin Zu Ken', 'gin.zu.ken@gmail.com', 'SUPER_ADMIN')
ON CONFLICT (uid) DO NOTHING;

INSERT INTO public.licenses (empresa_id, id, plan, vencimiento) VALUES
('c1', 'c1', 'PRO', '2027-12-31'),
('c2', 'c2', 'ENTERPRISE', '2028-06-30'),
('c3', 'c3', 'BASIC', '2026-08-15')
ON CONFLICT (empresa_id) DO NOTHING;

INSERT INTO public.modules (codigo, id, nombre, "desc", icon, activo, visible_landing) VALUES
('INFRACOST', 'INFRACOST', 'InfraCost Lite', 'Gestión clásica de presupuestos de obra y Análisis de Precios Unitarios (APU) esenciales.', '💰', true, true),
('INFRACOST_PRO', 'INFRACOST_PRO', 'InfraCost', 'Presupuestos de obra profesionales con pantalla dividida (Spreadsheet + Especificaciones y Asistente IA Gemini integrado).', '📊', true, true),
('INFRAGEO', 'INFRAGEO', 'InfraGeo', 'Mapeo geotécnico, modelado de sondajes y registro de ensayos de mecánica de suelos en campo.', '🕳️', true, true),
('INFRABIM', 'INFRABIM', 'InfraBIM', 'Visualización y coordinación de modelos 3D en formato abierto IFC directamente en el navegador.', '📐', true, true),
('INFRACONTROL', 'INFRACONTROL', 'InfraControl', 'Seguimiento financiero de obra, generación de valorizaciones mensuales y curvas S de avance.', '📈', true, true),
('INFRADOCS', 'INFRADOCS', 'InfraDocs', 'Gestión documental y almacenamiento estructurado de planos, contratos e informes técnicos.', '📂', true, true),
('INFRAFIELD', 'INFRAFIELD', 'InfraField', 'Órdenes de inspección, diarios de obra digitales y reportes fotográficos geo-localizados.', '📋', true, true),
('INFRAAI', 'INFRAAI', 'InfraAI', 'Predicción de desviaciones de costo y análisis de riesgo mediante algoritmos de Inteligencia Artificial.', '🧠', true, true),
('INFRAADMIN', 'INFRAADMIN', 'InfraAdmin', 'Consola central de gobernanza para la gestión de usuarios, roles, empresas y licencias de la suite.', '🛡️', true, true)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.company_modules (id, empresa_id, modulo_id) VALUES
('c1_INFRACOST', 'c1', 'INFRACOST'),
('c1_INFRACOST_PRO', 'c1', 'INFRACOST_PRO'),
('c1_INFRADOCS', 'c1', 'INFRADOCS'),
('c2_INFRAGEO', 'c2', 'INFRAGEO'),
('c2_INFRAAI', 'c2', 'INFRAAI'),
('c3_INFRACONTROL', 'c3', 'INFRACONTROL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans (id, title, promo, "desc", price, features, popular) VALUES
('p1', 'Plan BASIC', '¡PROMO: 1 Mes Gratis!', 'Ideal para pequeños contratistas independientes y proyectos unitarios.', '99', 'Acceso a 3 módulos esenciales,Hasta 5 usuarios activos,Base de datos local SQLite,Soporte técnico por correo', false),
('p2', 'Plan PRO', '¡PROMO: -20% Pago Anual!', 'Diseñado para empresas constructoras medianas con flujos continuos.', '199', 'Acceso a 6 módulos del ecosistema,Hasta 25 usuarios activos,Sincronización en la nube (Supabase),Soporte prioritario 24/7,Gestión documental avanzada', true),
('p3', 'Plan ENTERPRISE', '¡PROMO: Piloto 14 Días!', 'La suite completa con integración analítica para grandes consorcios.', '349', 'Todos los módulos (incluye InfraAI),Usuarios y proyectos ilimitados,Gobernanza multiempresa (InfraAdmin),Respaldos automáticos cada hora,Integración API personalizada', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, nombre, logo) VALUES
('cl1', 'Alfa Contratistas', '🏢'),
('cl2', 'Suelos Delta S.A.C.', '🕳️'),
('cl3', 'Minera Andina', '⛰️'),
('cl4', 'Consorcio Vial Sur', '🛣️'),
('cl5', 'BIM Projects', '📐')
ON CONFLICT (id) DO NOTHING;
