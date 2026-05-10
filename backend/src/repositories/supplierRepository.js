const { getPool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function listSuppliersByMaterialName(materialName) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT DISTINCT s.\"SupplierId\", s.\"SupplierName\", s.\"Location\", s.\"Email\", s.\"PhoneNumber\" " +
      "FROM public.suppliers s " +
      "JOIN public.supplier_materials sm ON sm.\"SupplierId\" = s.\"SupplierId\" " +
      "WHERE sm.\"MaterialName\" ILIKE $1 " +
      "ORDER BY s.\"SupplierName\" ASC",
    [materialName]
  );

  return result.rows;
}

async function listSuppliersWithMaterials() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT s.\"SupplierId\", s.\"SupplierName\", s.\"Location\", s.\"Email\", s.\"PhoneNumber\", " +
      "COALESCE(array_agg(sm.\"MaterialName\") FILTER (WHERE sm.\"MaterialName\" IS NOT NULL), '{}') AS \"Materials\" " +
      "FROM public.suppliers s " +
      "LEFT JOIN public.supplier_materials sm ON sm.\"SupplierId\" = s.\"SupplierId\" " +
      "GROUP BY s.\"SupplierId\", s.\"SupplierName\", s.\"Location\", s.\"Email\", s.\"PhoneNumber\" " +
      "ORDER BY s.\"SupplierName\" ASC"
  );

  return result.rows;
}

async function getSupplierById(supplierId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"SupplierId\", \"SupplierName\", \"Location\", \"Email\", \"PhoneNumber\" " +
      "FROM public.suppliers WHERE \"SupplierId\" = $1",
    [supplierId]
  );

  return result.rows[0] || null;
}

async function getNextSupplierId() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT COALESCE(MAX(NULLIF(regexp_replace(\"SupplierId\", '[^0-9]', '', 'g'), '')::int), 0) + 1 AS next_id " +
      "FROM public.suppliers"
  );

  const nextId = Number(result.rows[0]?.next_id || 1);
  return `SUP-${String(nextId).padStart(3, "0")}`;
}

async function createSupplierWithMaterials(supplier, materials) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "INSERT INTO public.suppliers (\"SupplierId\", \"SupplierName\", \"Location\", \"Email\", \"PhoneNumber\") " +
        "VALUES ($1, $2, $3, $4, $5)",
      [supplier.supplierId, supplier.supplierName, supplier.location, supplier.email, supplier.phoneNumber]
    );

    if (materials.length > 0) {
      const values = materials
        .map((_, index) => {
          const base = index * 3;
          return `($${base + 1}, $${base + 2}, $${base + 3})`;
        })
        .join(", ");
      const params = materials.flatMap((material) => [uuidv4(), supplier.supplierId, material]);
      await client.query(
        "INSERT INTO public.supplier_materials (\"MaterialLinkId\", \"SupplierId\", \"MaterialName\") VALUES " + values,
        params
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listSuppliersByMaterialName,
  listSuppliersWithMaterials,
  getSupplierById,
  getNextSupplierId,
  createSupplierWithMaterials
};
