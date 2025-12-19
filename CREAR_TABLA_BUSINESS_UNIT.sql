-- Script para crear la tabla business_units en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear tabla business_units
CREATE TABLE IF NOT EXISTS business_units (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo (ajusta según tus necesidades)
INSERT INTO business_units (id, name, description) VALUES
  (1, 'Campus Norte', 'Unidad de negocio Campus Norte'),
  (2, 'Campus Sur', 'Unidad de negocio Campus Sur'),
  (3, 'Parque Tecnológico', 'Unidad de negocio Parque Tecnológico'),
  (4, 'Hub Innovación', 'Unidad de negocio Hub Innovación')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

-- Política básica: Todos los usuarios autenticados pueden leer
CREATE POLICY "Users can read business_units" ON business_units
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Opcional: Política para que solo admins puedan modificar
-- CREATE POLICY "Admins can modify business_units" ON business_units
--   FOR ALL
--   USING (auth.role() = 'authenticated');

-- Verificar que la tabla se creó correctamente
SELECT * FROM business_units ORDER BY id;

