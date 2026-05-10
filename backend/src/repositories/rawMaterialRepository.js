const { getPool } = require("../config/database");

async function listRawMaterials() {
  const pool = getPool();
  await pool.query(
    "UPDATE public.raw_materials SET \"Status\" = CASE " +
      "WHEN \"CurrentQuantity\" > \"ReorderLevel\" THEN 'OK' " +
      "WHEN \"CurrentQuantity\" = \"ReorderLevel\" THEN 'Equal' " +
      "ELSE 'Low' END, \"UpdatedAt\" = now()"
  );
  const result = await pool.query(
    "SELECT \"MaterialId\", \"MaterialName\", \"ReorderLevel\", \"CurrentQuantity\", " +
      "\"Unit\", \"UnitCost\", \"TotalCost\", " +
      "CASE " +
      "WHEN \"CurrentQuantity\" > \"ReorderLevel\" THEN 'OK' " +
      "WHEN \"CurrentQuantity\" = \"ReorderLevel\" THEN 'Equal' " +
      "ELSE 'Low' END AS \"Status\", " +
      "\"CreatedAt\", \"UpdatedAt\" " +
      "FROM public.raw_materials ORDER BY \"CreatedAt\" DESC"
  );

  return result.rows;
}

async function getNextMaterialId() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT COALESCE(MAX(NULLIF(regexp_replace(\"MaterialId\", '\\\\D', '', 'g'), '')::int), 0) + 1 AS next_id " +
      "FROM public.raw_materials"
  );

  return String(result.rows[0]?.next_id || 1);
}

async function createRawMaterial(material) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO public.raw_materials (\"MaterialId\", \"MaterialName\", \"ReorderLevel\", " +
      "\"CurrentQuantity\", \"Unit\", \"UnitCost\", \"TotalCost\", \"Status\") " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      material.materialId,
      material.materialName,
      material.reorderLevel,
      material.currentQuantity,
      material.unit,
      material.unitCost,
      material.totalCost,
      material.status
    ]
  );
}

async function getRawMaterialById(materialId, client = null) {
  const runner = client || getPool();
  const result = await runner.query(
    "SELECT \"MaterialId\", \"MaterialName\", \"ReorderLevel\", \"CurrentQuantity\", " +
      "\"Unit\", \"UnitCost\", \"TotalCost\", \"Status\" " +
      "FROM public.raw_materials WHERE \"MaterialId\" = $1",
    [materialId]
  );

  return result.rows[0] || null;
}

async function updateRawMaterialTotals(material, client = null) {
  const runner = client || getPool();
  await runner.query(
    "UPDATE public.raw_materials SET \"CurrentQuantity\" = $2, \"Unit\" = $3, \"UnitCost\" = $4, " +
      "\"TotalCost\" = $5, \"Status\" = $6, \"UpdatedAt\" = now() WHERE \"MaterialId\" = $1",
    [
      material.materialId,
      material.currentQuantity,
      material.unit,
      material.unitCost,
      material.totalCost,
      material.status
    ]
  );
}

module.exports = {
  listRawMaterials,
  createRawMaterial,
  getNextMaterialId,
  getRawMaterialById,
  updateRawMaterialTotals
};
