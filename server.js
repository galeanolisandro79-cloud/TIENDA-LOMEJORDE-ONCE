require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, iniciarBaseDeDatos } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// GET /api/productos?q=&page=&limit= — catálogo público, solo lectura.
app.get('/api/productos', async (req, res) => {
  const q = (req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 24));
  const offset = (page - 1) * limit;
  try {
    let where = 'WHERE cantidad > 0';
    let params = [];
    if (q) {
      where += ' AND (lower(codigo) LIKE $1 OR lower(nombre) LIKE $1)';
      params.push(`%${q.toLowerCase()}%`);
    }
    const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM productos ${where}`, params);
    const total = totalRes.rows[0].total;
    const dataParams = [...params, limit, offset];
    const dataRes = await pool.query(
      `SELECT id, codigo, nombre, precio, cantidad, imagen FROM productos ${where}
       ORDER BY lower(nombre) ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    );
    res.json({ productos: dataRes.rows, total, page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener el catálogo.' });
  }
});

// POST /api/pedidos — cualquier visitante puede hacer un pedido, sin login.
app.post('/api/pedidos', async (req, res) => {
  const { items, cliente } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }
  if (!cliente || !cliente.nombre || !cliente.telefono || !cliente.direccion) {
    return res.status(400).json({ error: 'Faltan datos de contacto o de envío.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const detalle = [];
    let total = 0;

    for (const item of items) {
      const { rows } = await client.query('SELECT * FROM productos WHERE id = $1 FOR UPDATE', [item.id]);
      const producto = rows[0];
      if (!producto) throw { status: 404, mensaje: 'Un artículo del carrito ya no está disponible.' };
      if (producto.cantidad < item.cantidad) {
        throw { status: 409, mensaje: `No hay suficiente stock de "${producto.nombre}". Disponible: ${producto.cantidad}.` };
      }
      await client.query('UPDATE productos SET cantidad = cantidad - $1, actualizado_en = now() WHERE id = $2', [item.cantidad, item.id]);
      const subtotal = Number(producto.precio) * item.cantidad;
      total += subtotal;
      detalle.push({ id: producto.id, codigo: producto.codigo, nombre: producto.nombre, precio: Number(producto.precio), cantidad: item.cantidad, subtotal });
    }

    const pedidoRes = await client.query(
      `INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_direccion, notas, total, detalle)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, fecha`,
      [cliente.nombre, cliente.telefono, cliente.direccion, cliente.notas || null, total, JSON.stringify(detalle)]
    );
    await client.query('COMMIT');
    res.status(201).json({ id: pedidoRes.rows[0].id, fecha: pedidoRes.rows[0].fecha, total, detalle });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.status) res.status(e.status).json({ error: e.mensaje });
    else { console.error(e); res.status(500).json({ error: 'No se pudo registrar el pedido.' }); }
  } finally {
    client.release();
  }
});

app.get('/api/salud', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

iniciarBaseDeDatos()
  .then(() => app.listen(PORT, () => console.log(`Tienda LO MEJOR DE ONCE corriendo en el puerto ${PORT}`)))
  .catch((e) => { console.error('No se pudo iniciar la base de datos:', e); process.exit(1); });
