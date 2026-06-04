const { getPool } = require("../config/database");
const stockReturnRepository = require("../repositories/stockReturnRepository");
const fifoRepository = require("../repositories/fifoRepository");
const rawMaterialRepository = require("../repositories/rawMaterialRepository");
const emailService = require("./emailService");
const { v4: uuidv4 } = require("uuid");

async function getAvailableBatches(materialId) {
  return stockReturnRepository.getAvailableBatchesByMaterial(materialId);
}

async function listReturns() {
  return stockReturnRepository.listStockReturns();
}

async function createReturn(payload) {
  const pool = getPool();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const now = new Date();
    const returnRow = {
      ReturnId: uuidv4(),
      MaterialId: payload.materialId,
      MaterialName: payload.materialName,
      IntakeId: payload.intakeId || null,
      FifoId: payload.fifoId || null,
      SupplierId: payload.supplierId || null,
      SupplierName: payload.supplierName || null,
      Quantity: Number(payload.quantity) || 0,
      Unit: payload.unit || "kg",
      UnitPrice: Number(payload.unitPrice) || 0,
      TotalCost: (Number(payload.quantity) || 0) * (Number(payload.unitPrice) || 0),
      Reason: payload.reason || "",
      ReturnDate: payload.returnDate || now
    };

    // reduce FIFO remaining quantity if fifoId provided
    if (returnRow.FifoId) {
      await client.query(
        'UPDATE public.fifo SET "RemainingQuantity" = GREATEST("RemainingQuantity" - $1, 0) WHERE "FifoId" = $2',
        [returnRow.Quantity, returnRow.FifoId]
      );
    }

    // update raw_materials totals
    await client.query(
      'UPDATE public.raw_materials SET "CurrentQuantity" = GREATEST("CurrentQuantity" - $1, 0), "TotalCost" = GREATEST("TotalCost" - $2, 0) WHERE "MaterialId" = $3',
      [returnRow.Quantity, returnRow.TotalCost, returnRow.MaterialId]
    );

    const created = await stockReturnRepository.createStockReturn(returnRow);

    // send email to supplier if email exists
    if (returnRow.SupplierName) {
      // attempt to fetch supplier email
      let supplierEmail = null;
      try {
        const res = await client.query('SELECT "Email" FROM public.suppliers WHERE "SupplierId" = $1', [returnRow.SupplierId]);
        supplierEmail = res.rows[0]?.Email;
      } catch (e) {
        supplierEmail = null;
      }

      if (supplierEmail) {
        const subject = `Return of stock: ${returnRow.MaterialName}`;
        const body = `Dear ${returnRow.SupplierName},\n\nWe are returning ${returnRow.Quantity} ${returnRow.Unit} of ${returnRow.MaterialName} (intake ${returnRow.IntakeId || "N/A"}) for the following reason:\n\n${returnRow.Reason}\n\nRegards`;
        try {
          await emailService.sendEmail({ to: supplierEmail, subject, text: body });
        } catch (e) {
          // log but do not fail the transaction
          console.error("Failed to send supplier email", e.message || e);
        }
      }
    }

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getAvailableBatches,
  listReturns,
  createReturn
};
