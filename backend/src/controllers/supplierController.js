const supplierRepository = require("../repositories/supplierRepository");

async function list(req, res, next) {
  try {
    const materialName = req.query.materialName;
    const data = materialName
      ? await supplierRepository.listSuppliersByMaterialName(materialName)
      : await supplierRepository.listSuppliersWithMaterials();
    return res.json({
      success: true,
      message: "Suppliers loaded successfully.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { supplierName, location, email, phoneNumber, materials } = req.body;
    if (!supplierName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "supplierName, email, and phoneNumber are required."
      });
    }

    const supplierId = await supplierRepository.getNextSupplierId();
    const supplier = {
      supplierId,
      supplierName,
      location: location || "",
      email,
      phoneNumber
    };
    const materialList = Array.isArray(materials)
      ? materials.filter((item) => item && String(item).trim().length > 0)
      : [];

    await supplierRepository.createSupplierWithMaterials(supplier, materialList);

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      data: {
        SupplierId: supplierId,
        SupplierName: supplierName,
        Location: supplier.location,
        Email: email,
        PhoneNumber: phoneNumber,
        Materials: materialList
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  create
};
