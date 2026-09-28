const { Pool } = require('pg');

const urlDeDatos = process.env.DATABASE_URL || '';
const esLocal = urlDeDatos.includes('localhost') || urlDeDatos.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false }
});

// La tienda no crea usuarios administradores — solo se asegura de que las
// tablas que necesita (productos, pedidos) existan, por si arranca antes
// que el sistema de administración.
async function iniciarBaseDeDatos() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      precio NUMERIC(12,2) NOT NULL DEFAULT 0,
      cantidad INTEGER NOT NULL DEFAULT 0,
      imagen TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      cliente_direccion TEXT NOT NULL,
      notas TEXT,
      total NUMERIC(12,2) NOT NULL,
      detalle JSONB NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente'
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (lower(nombre));`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos (lower(codigo));`);
}

module.exports = { pool, iniciarBaseDeDatos };
