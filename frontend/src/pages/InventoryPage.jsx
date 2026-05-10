import { useEffect, useState } from "react";
import ProfileMenu from "../components/ProfileMenu";
import {
  createRawMaterial,
  createSupplier,
  createStockIntake,
  createPurchaseRequest,
  fetchPurchaseRequests,
  fetchRawMaterials,
  fetchSuppliers,
  fetchStockIntakes,
  fetchSuppliersByMaterial
} from "../api";

const SUMMARY_CARDS = [
  { label: "Low stock", value: "12", helper: "SKUs", tone: "danger" },
  { label: "Inventory value", value: "LKR 1,250,000", helper: "LKR", tone: "success" },
  { label: "In this month", value: "1,200", helper: "Movements", tone: "info" }
];

const LOW_STOCK = [
  { name: "Sugar", qty: 20, status: "Critical" },
  { name: "Oil", qty: 15, status: "Critical" },
  { name: "Flour", qty: 100, status: "Moderate" },
  { name: "Salt", qty: 50, status: "OK" },
  { name: "Nuts", qty: 30, status: "OK" }
];

const RECENT_TRANSACTIONS = [
  { date: "2025-12-04", item: "Sugar" },
  { date: "2025-12-03", item: "Flour" },
  { date: "2025-12-01", item: "Oil" },
  { date: "2025-11-30", item: "Nuts" },
  { date: "2025-11-29", item: "Sugar" }
];

const initialMaterialForm = {
  materialName: "",
  reorderLevel: "",
  currentQuantity: "",
  unit: "kg",
  totalCost: ""
};

const initialStockForm = {
  materialId: "",
  supplierId: "",
  quantity: "",
  unit: "kg",
  unitPrice: "",
  intakeDate: ""
};

const initialSupplierForm = {
  supplierName: "",
  location: "",
  email: "",
  phoneNumber: "",
  materials: ""
};

const initialPurchaseForm = {
  materialId: "",
  supplierId: "",
  quantity: "",
  unit: "kg",
  notes: ""
};

export default function InventoryPage({ company, onLogout, onBackHome }) {
  const [activeSection, setActiveSection] = useState("summary");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);
  const [materialStatus, setMaterialStatus] = useState({ type: "", message: "" });
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [stockIntakes, setStockIntakes] = useState([]);
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [stockSuppliers, setStockSuppliers] = useState([]);
  const [stockStatus, setStockStatus] = useState({ type: "", message: "" });
  const [savingStock, setSavingStock] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [supplierTab, setSupplierTab] = useState("suppliers");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);
  const [supplierStatus, setSupplierStatus] = useState({ type: "", message: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [purchaseMaterialName, setPurchaseMaterialName] = useState("");
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);
  const [purchaseSuppliers, setPurchaseSuppliers] = useState([]);
  const [purchaseStatus, setPurchaseStatus] = useState({ type: "", message: "" });
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState([]);

  const refreshSuppliers = async () => {
    try {
      const response = await fetchSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      setSupplierStatus({ type: "error", message: error.message });
    }
  };

  const refreshPurchaseRequests = async () => {
    try {
      const response = await fetchPurchaseRequests();
      setPurchaseRequests(response.data || []);
    } catch (error) {
      setPurchaseStatus({ type: "error", message: error.message });
    }
  };

  const refreshRawMaterials = async () => {
    try {
      const response = await fetchRawMaterials();
      setRawMaterials(response.data || []);
    } catch (error) {
      setMaterialStatus({ type: "error", message: error.message });
    }
  };

  const refreshStockIntakes = async () => {
    try {
      const response = await fetchStockIntakes();
      setStockIntakes(response.data || []);
    } catch (error) {
      setStockStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    if (activeSection === "raw") {
      refreshRawMaterials();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "stock") {
      refreshStockIntakes();
      if (rawMaterials.length === 0) {
        fetchRawMaterials()
          .then((response) => setRawMaterials(response.data || []))
          .catch((error) => setStockStatus({ type: "error", message: error.message }));
      }
    }
  }, [activeSection, rawMaterials.length]);

  useEffect(() => {
    if (activeSection === "suppliers") {
      refreshSuppliers();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "suppliers" && supplierTab === "purchase") {
      refreshPurchaseRequests();
    }
  }, [activeSection, supplierTab]);

  useEffect(() => {
    if (isPurchaseModalOpen && rawMaterials.length === 0) {
      fetchRawMaterials()
        .then((response) => setRawMaterials(response.data || []))
        .catch((error) => setPurchaseStatus({ type: "error", message: error.message }));
    }
  }, [isPurchaseModalOpen, rawMaterials.length]);

  useEffect(() => {
    if (!isPurchaseModalOpen) {
      return;
    }

    if (!purchaseMaterialName) {
      return;
    }

    const selectedMaterial = rawMaterials.find(
      (item) => String(item.MaterialName).toLowerCase() === String(purchaseMaterialName).toLowerCase()
    );

    if (selectedMaterial) {
      setPurchaseForm((prev) => ({
        ...prev,
        materialId: selectedMaterial.MaterialId,
        unit: selectedMaterial.Unit || "kg"
      }));

      fetchSuppliersByMaterial(selectedMaterial.MaterialName)
        .then((response) => setPurchaseSuppliers(response.data || []))
        .catch((error) => setPurchaseStatus({ type: "error", message: error.message }));
    }
  }, [isPurchaseModalOpen, purchaseMaterialName, rawMaterials]);

  const handleMaterialChange = (event) => {
    const { name, value } = event.target;
    setMaterialForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialSubmit = async (event) => {
    event.preventDefault();
    setSavingMaterial(true);
    setMaterialStatus({ type: "", message: "" });

    try {
      const response = await createRawMaterial(materialForm);
      setRawMaterials((prev) => [response.data, ...prev]);
      setMaterialForm(initialMaterialForm);
      setMaterialStatus({ type: "success", message: response.message });
      setIsMaterialModalOpen(false);
    } catch (error) {
      setMaterialStatus({ type: "error", message: error.message });
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleStockChange = (event) => {
    const { name, value } = event.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockMaterialChange = async (event) => {
    const materialId = event.target.value;
    const selectedMaterial = rawMaterials.find((item) => item.MaterialId === materialId);

    setStockForm((prev) => ({
      ...prev,
      materialId,
      supplierId: "",
      unit: selectedMaterial?.Unit || "kg"
    }));

    if (selectedMaterial?.MaterialName) {
      try {
        const response = await fetchSuppliersByMaterial(selectedMaterial.MaterialName);
        setStockSuppliers(response.data || []);
      } catch (error) {
        setStockStatus({ type: "error", message: error.message });
      }
    }
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    setSavingStock(true);
    setStockStatus({ type: "", message: "" });

    try {
      const selectedMaterial = rawMaterials.find((item) => item.MaterialId === stockForm.materialId);
      const selectedSupplier = stockSuppliers.find((item) => item.SupplierId === stockForm.supplierId);

      if (!selectedMaterial || !selectedSupplier) {
        throw new Error("Select a material and supplier.");
      }

      const payload = {
        materialId: selectedMaterial.MaterialId,
        materialName: selectedMaterial.MaterialName,
        supplierId: selectedSupplier.SupplierId,
        supplierName: selectedSupplier.SupplierName,
        quantity: stockForm.quantity,
        unit: stockForm.unit,
        unitPrice: stockForm.unitPrice,
        intakeDate: stockForm.intakeDate || undefined
      };

      const response = await createStockIntake(payload);
      setStockIntakes((prev) => [response.data, ...prev]);
      setStockForm(initialStockForm);
      setIsStockModalOpen(false);
      setStockSuppliers([]);

      const refreshed = await fetchRawMaterials();
      setRawMaterials(refreshed.data || []);
      setStockStatus({ type: "success", message: response.message });
    } catch (error) {
      setStockStatus({ type: "error", message: error.message });
    } finally {
      setSavingStock(false);
    }
  };

  const handleSupplierChange = (event) => {
    const { name, value } = event.target;
    setSupplierForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    setSavingSupplier(true);
    setSupplierStatus({ type: "", message: "" });

    try {
      const materials = supplierForm.materials
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const response = await createSupplier({
        supplierName: supplierForm.supplierName,
        location: supplierForm.location,
        email: supplierForm.email,
        phoneNumber: supplierForm.phoneNumber,
        materials
      });

      setSuppliers((prev) => [response.data, ...prev]);
      setSupplierForm(initialSupplierForm);
      setIsSupplierModalOpen(false);
      setSupplierStatus({ type: "success", message: response.message });
    } catch (error) {
      setSupplierStatus({ type: "error", message: error.message });
    } finally {
      setSavingSupplier(false);
    }
  };

  const handlePurchaseAction = (materialName) => {
    const selectedMaterial = rawMaterials.find((item) => item.MaterialName === materialName);
    setPurchaseMaterialName(materialName || "");
    setActiveSection("suppliers");
    setSupplierTab("purchase");
    setPurchaseStatus({ type: "", message: "" });
    setIsPurchaseModalOpen(true);

    if (selectedMaterial) {
      setPurchaseForm((prev) => ({
        ...prev,
        materialId: selectedMaterial.MaterialId,
        unit: selectedMaterial.Unit || "kg",
        supplierId: ""
      }));

      fetchSuppliersByMaterial(selectedMaterial.MaterialName)
        .then((response) => setPurchaseSuppliers(response.data || []))
        .catch((error) => setPurchaseStatus({ type: "error", message: error.message }));
    } else {
      setPurchaseSuppliers([]);
    }
  };

  const openPurchaseModal = () => {
    setPurchaseStatus({ type: "", message: "" });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseChange = (event) => {
    const { name, value } = event.target;
    setPurchaseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchaseMaterialChange = async (event) => {
    const materialId = event.target.value;
    const selectedMaterial = rawMaterials.find((item) => item.MaterialId === materialId);

    setPurchaseForm((prev) => ({
      ...prev,
      materialId,
      supplierId: "",
      unit: selectedMaterial?.Unit || "kg"
    }));

    if (selectedMaterial?.MaterialName) {
      try {
        const response = await fetchSuppliersByMaterial(selectedMaterial.MaterialName);
        setPurchaseSuppliers(response.data || []);
      } catch (error) {
        setPurchaseStatus({ type: "error", message: error.message });
      }
    } else {
      setPurchaseSuppliers([]);
    }
  };

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault();
    setSavingPurchase(true);
    setPurchaseStatus({ type: "", message: "" });

    try {
      const selectedMaterial = rawMaterials.find((item) => item.MaterialId === purchaseForm.materialId);
      const selectedSupplier = purchaseSuppliers.find(
        (item) => item.SupplierId === purchaseForm.supplierId
      );

      if (!selectedMaterial || !selectedSupplier) {
        throw new Error("Select a material and supplier.");
      }

      const payload = {
        supplierId: selectedSupplier.SupplierId,
        rawMaterialName: selectedMaterial.MaterialName,
        requestedQuantity: purchaseForm.quantity,
        unit: purchaseForm.unit,
        notes: purchaseForm.notes,
        companyName: company?.companyName || company?.CompanyName || ""
      };

      const response = await createPurchaseRequest(payload);
      setPurchaseForm(initialPurchaseForm);
      setPurchaseSuppliers([]);
      setIsPurchaseModalOpen(false);
      setPurchaseMaterialName("");
      setPurchaseRequests((prev) => [response.data, ...prev]);
      setPurchaseStatus({ type: "success", message: response.message });
    } catch (error) {
      setPurchaseStatus({ type: "error", message: error.message });
    } finally {
      setSavingPurchase(false);
    }
  };

  return (
    <div className="inventory-page">
      <header className="inventory-topbar">
        <button className="back-button" type="button" onClick={onBackHome}>
          ← Back to Home
        </button>
        <div className="inventory-title">
          <span className="inventory-icon">📦</span>
          <h1>Inventory Control Dashboard</h1>
          <button className="ghost" type="button">Refresh</button>
        </div>
        <div className="topbar-right">
          <ProfileMenu company={company} onLogout={onLogout} />
        </div>
      </header>

      <div className="inventory-shell">
        <aside className="inventory-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-badge">📊</div>
            <div>
              <p className="sidebar-title">Inventory Hub</p>
              <p className="sidebar-subtitle">Real-time overview</p>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Navigation</p>
            <button
              className={`sidebar-link ${activeSection === "summary" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveSection("summary")}
            >
              Summary
            </button>
            <button
              className={`sidebar-link ${activeSection === "raw" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveSection("raw")}
            >
              Raw Material
            </button>
            <button
              className={`sidebar-link ${activeSection === "stock" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveSection("stock")}
            >
              Stock
            </button>
            <button
              className={`sidebar-link ${activeSection === "suppliers" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveSection("suppliers")}
            >
              Supplier Directory
            </button>
          </div>
        </aside>

        <main className="inventory-main">
          {activeSection === "summary" ? (
            <>
              <section className="inventory-summary">
                <div>
                  <h2>Inventory Summary</h2>
                  <p className="muted">Live KPIs, low stock risks, and recent movement.</p>
                </div>
                <button className="outline" type="button">Refresh</button>
              </section>

              <section className="summary-grid">
                {SUMMARY_CARDS.map((card) => (
                  <div key={card.label} className="summary-card">
                    <p className="summary-label">{card.label}</p>
                    <p className={`summary-value ${card.tone}`}>{card.value}</p>
                    <p className="summary-helper">{card.helper}</p>
                  </div>
                ))}
              </section>

              <section className="inventory-panels">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Low Stock Items</h3>
                      <p className="muted">Monitor materials approaching minimum levels</p>
                    </div>
                  </div>
                  <div className="table">
                    <div className="table-row header">
                      <span>Name</span>
                      <span>Qty</span>
                      <span>Status</span>
                    </div>
                    {LOW_STOCK.map((item) => (
                      <div key={item.name} className="table-row">
                        <span>{item.name}</span>
                        <span>{item.qty}</span>
                        <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Recent Transactions</h3>
                      <p className="muted">Track what moved most recently</p>
                    </div>
                  </div>
                  <div className="table">
                    <div className="table-row header two">
                      <span>Date</span>
                      <span>Item</span>
                    </div>
                    {RECENT_TRANSACTIONS.map((row) => (
                      <div key={`${row.date}-${row.item}`} className="table-row two">
                        <span>{row.date}</span>
                        <span>{row.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "raw" ? (
            <section className="panel">
              <div className="panel-header space-between">
                <div>
                  <h3>Raw Material Overview</h3>
                  <p className="muted">Track health, reorder priorities, and compliance.</p>
                </div>
                <button
                  className="primary"
                  type="button"
                  onClick={() => {
                    setMaterialStatus({ type: "", message: "" });
                    setIsMaterialModalOpen(true);
                  }}
                >
                  Add raw material
                </button>
                <button className="ghost" type="button" onClick={refreshRawMaterials}>
                  Refresh
                </button>
              </div>
              {materialStatus.message ? (
                <div className={`alert ${materialStatus.type}`}>{materialStatus.message}</div>
              ) : null}

              {isMaterialModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                  <div className="modal">
                    <div className="modal-header">
                      <div>
                        <h4>Add raw material</h4>
                        <p className="muted">Provide material details and save to inventory.</p>
                      </div>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => setIsMaterialModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                    <form className="form material-form" onSubmit={handleMaterialSubmit}>
                      <label>
                        Material name
                        <input
                          name="materialName"
                          value={materialForm.materialName}
                          onChange={handleMaterialChange}
                          required
                        />
                      </label>
                      <label>
                        Reorder level
                        <input
                          name="reorderLevel"
                          type="number"
                          step="0.01"
                          value={materialForm.reorderLevel}
                          onChange={handleMaterialChange}
                        />
                      </label>
                      <label>
                        Current quantity
                        <input
                          name="currentQuantity"
                          type="number"
                          step="0.01"
                          value={materialForm.currentQuantity}
                          onChange={handleMaterialChange}
                        />
                      </label>
                      <label>
                        Unit
                        <input name="unit" value={materialForm.unit} onChange={handleMaterialChange} />
                      </label>
                      <label>
                        Total cost
                        <input
                          name="totalCost"
                          type="number"
                          step="0.01"
                          value={materialForm.totalCost}
                          onChange={handleMaterialChange}
                        />
                      </label>
                      <button className="primary" type="submit" disabled={savingMaterial}>
                        {savingMaterial ? "Saving..." : "Save raw material"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              <div className="table">
                <div className="table-row header seven">
                  <span>Material</span>
                  <span>Reorder level</span>
                  <span>Current quantity</span>
                  <span>Unit</span>
                  <span>Total cost</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {rawMaterials.map((item) => (
                  <div key={item.MaterialId} className="table-row seven">
                    <span>{item.MaterialName}</span>
                    <span>{item.ReorderLevel}</span>
                    <span>{item.CurrentQuantity}</span>
                    <span>{item.Unit}</span>
                    <span>{item.TotalCost}</span>
                    <span className={`status-pill ${String(item.Status || "OK").toLowerCase()}`}>
                      {item.Status || "OK"}
                    </span>
                    {(String(item.Status || "OK").toLowerCase() === "low" ||
                      String(item.Status || "OK").toLowerCase() === "equal") ? (
                      <button
                        className="ghost action-button"
                        type="button"
                        onClick={() => handlePurchaseAction(item.MaterialName)}
                      >
                        Order
                      </button>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeSection === "stock" ? (
            <section className="panel">
              <div className="panel-header space-between">
                <div>
                  <h3>Stock Management</h3>
                  <p className="muted">Switch between add, issue, and waste flows.</p>
                </div>
                <button
                  className="primary"
                  type="button"
                  onClick={() => {
                    setStockStatus({ type: "", message: "" });
                    setIsStockModalOpen(true);
                  }}
                >
                  Add stock intake
                </button>
                <button className="ghost" type="button" onClick={refreshStockIntakes}>
                  Refresh
                </button>
              </div>
              <div className="pill-row">
                <button className="pill active" type="button">Add stock</button>
                <button className="pill" type="button">Issue stock</button>
                <button className="pill" type="button">Waste stock</button>
              </div>
              <div className="panel-card">
                <h4>Add Stock Intake</h4>
                <p className="muted">Capture inbound deliveries, suppliers, and batch identifiers.</p>
              </div>

              {stockStatus.message ? (
                <div className={`alert ${stockStatus.type}`}>{stockStatus.message}</div>
              ) : null}

              {isStockModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                  <div className="modal">
                    <div className="modal-header">
                      <div>
                        <h4>Add stock intake</h4>
                        <p className="muted">Capture the material, supplier, and landed cost.</p>
                      </div>
                      <button className="ghost" type="button" onClick={() => setIsStockModalOpen(false)}>
                        Close
                      </button>
                    </div>
                    <form className="form material-form" onSubmit={handleStockSubmit}>
                      <label>
                        Raw material
                        <select
                          name="materialId"
                          value={stockForm.materialId}
                          onChange={handleStockMaterialChange}
                          required
                        >
                          <option value="">Select material</option>
                          {rawMaterials.map((material) => (
                            <option key={material.MaterialId} value={material.MaterialId}>
                              {material.MaterialName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Supplier
                        <select
                          name="supplierId"
                          value={stockForm.supplierId}
                          onChange={handleStockChange}
                          required
                        >
                          <option value="">Select supplier</option>
                          {stockSuppliers.map((supplier) => (
                            <option key={supplier.SupplierId} value={supplier.SupplierId}>
                              {supplier.SupplierName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Quantity
                        <input
                          name="quantity"
                          type="number"
                          step="0.01"
                          value={stockForm.quantity}
                          onChange={handleStockChange}
                          required
                        />
                      </label>
                      <label>
                        Unit
                        <input name="unit" value={stockForm.unit} onChange={handleStockChange} />
                      </label>
                      <label>
                        Unit price
                        <input
                          name="unitPrice"
                          type="number"
                          step="0.01"
                          value={stockForm.unitPrice}
                          onChange={handleStockChange}
                          required
                        />
                      </label>
                      <label>
                        Date
                        <input
                          name="intakeDate"
                          type="date"
                          value={stockForm.intakeDate}
                          onChange={handleStockChange}
                        />
                      </label>
                      <div className="total-pill">
                        <span>Auto total</span>
                        <strong>
                          LKR {(Number(stockForm.quantity) || 0) * (Number(stockForm.unitPrice) || 0)}
                        </strong>
                      </div>
                      <button className="primary" type="submit" disabled={savingStock}>
                        {savingStock ? "Saving..." : "Add stock"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              <div className="stock-card-grid">
                {stockIntakes.map((intake) => (
                  <article key={intake.IntakeId} className="stock-card">
                    <div className="stock-card-header">
                      <div>
                        <h4>{intake.MaterialName}</h4>
                        <p className="muted">Supplier: {intake.SupplierName}</p>
                      </div>
                      <span className="muted">
                        {intake.IntakeDate ? String(intake.IntakeDate).slice(0, 10) : ""}
                      </span>
                    </div>
                    <div className="stock-card-row">
                      <div>
                        <p className="muted">Quantity</p>
                        <strong>{intake.Quantity} {intake.Unit}</strong>
                      </div>
                      <div>
                        <p className="muted">Unit price</p>
                        <strong>LKR {intake.UnitPrice} / {intake.Unit}</strong>
                      </div>
                    </div>
                    <span className="stock-total">LKR {intake.TotalCost}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeSection === "suppliers" ? (
            <section className="panel">
              <div className="panel-header space-between">
                <div>
                  <h3>Supplier Directory</h3>
                  <p className="muted">Preferred partners, SLAs, and last engagement.</p>
                </div>
                {supplierTab === "suppliers" ? (
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      setSupplierStatus({ type: "", message: "" });
                      setIsSupplierModalOpen(true);
                    }}
                  >
                    Add supplier
                  </button>
                ) : (
                  <button className="primary" type="button" onClick={openPurchaseModal}>
                    Create purchase request
                  </button>
                )}
                {supplierTab === "suppliers" ? (
                  <button className="ghost" type="button" onClick={refreshSuppliers}>
                    Refresh
                  </button>
                ) : (
                  <button className="ghost" type="button" onClick={refreshPurchaseRequests}>
                    Refresh
                  </button>
                )}
              </div>
              {supplierStatus.message ? (
                <div className={`alert ${supplierStatus.type}`}>{supplierStatus.message}</div>
              ) : null}
              <div className="supplier-tabs">
                <button
                  className={`pill ${supplierTab === "suppliers" ? "active" : ""}`}
                  type="button"
                  onClick={() => setSupplierTab("suppliers")}
                >
                  Suppliers
                </button>
                <button
                  className={`pill ${supplierTab === "purchase" ? "active" : ""}`}
                  type="button"
                  onClick={() => setSupplierTab("purchase")}
                >
                  Purchase
                </button>
              </div>
              {isSupplierModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                  <div className="modal">
                    <div className="modal-header">
                      <div>
                        <h4>Add supplier</h4>
                        <p className="muted">Capture supplier details and materials supplied.</p>
                      </div>
                      <button className="ghost" type="button" onClick={() => setIsSupplierModalOpen(false)}>
                        Close
                      </button>
                    </div>
                    <form className="form material-form" onSubmit={handleSupplierSubmit}>
                      <label>
                        Supplier name
                        <input
                          name="supplierName"
                          value={supplierForm.supplierName}
                          onChange={handleSupplierChange}
                          required
                        />
                      </label>
                      <label>
                        Location
                        <input name="location" value={supplierForm.location} onChange={handleSupplierChange} />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          name="email"
                          value={supplierForm.email}
                          onChange={handleSupplierChange}
                          required
                        />
                      </label>
                      <label>
                        Phone number
                        <input
                          name="phoneNumber"
                          value={supplierForm.phoneNumber}
                          onChange={handleSupplierChange}
                          required
                        />
                      </label>
                      <label>
                        Raw materials (comma separated)
                        <input
                          name="materials"
                          value={supplierForm.materials}
                          onChange={handleSupplierChange}
                          placeholder="Sugar, Flour"
                        />
                      </label>
                      <button className="primary" type="submit" disabled={savingSupplier}>
                        {savingSupplier ? "Saving..." : "Add supplier"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              {isPurchaseModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                  <div className="modal">
                    <div className="modal-header">
                      <div>
                        <h4>Create purchase request</h4>
                        <p className="muted">
                          Type the raw material you need and pick a supplier that already offers it.
                        </p>
                      </div>
                      <button className="ghost" type="button" onClick={() => setIsPurchaseModalOpen(false)}>
                        Close
                      </button>
                    </div>
                    <form className="form material-form" onSubmit={handlePurchaseSubmit}>
                      <label>
                        Raw material needed
                        <select
                          name="materialId"
                          value={purchaseForm.materialId}
                          onChange={handlePurchaseMaterialChange}
                          required
                        >
                          <option value="">Select material</option>
                          {rawMaterials.map((material) => (
                            <option key={material.MaterialId} value={material.MaterialId}>
                              {material.MaterialName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Supplier
                        <select
                          name="supplierId"
                          value={purchaseForm.supplierId}
                          onChange={handlePurchaseChange}
                          required
                        >
                          <option value="">Select supplier</option>
                          {purchaseSuppliers.map((supplier) => (
                            <option key={supplier.SupplierId} value={supplier.SupplierId}>
                              {supplier.SupplierName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Quantity
                        <input
                          name="quantity"
                          type="number"
                          step="0.01"
                          value={purchaseForm.quantity}
                          onChange={handlePurchaseChange}
                          required
                        />
                      </label>
                      <label>
                        Unit
                        <select name="unit" value={purchaseForm.unit} onChange={handlePurchaseChange}>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="pcs">pcs</option>
                        </select>
                      </label>
                      <label>
                        Notes (optional)
                        <textarea
                          name="notes"
                          value={purchaseForm.notes}
                          onChange={handlePurchaseChange}
                          rows={4}
                        />
                      </label>
                      <div className="purchase-actions">
                        <button className="ghost" type="button" onClick={() => setIsPurchaseModalOpen(false)}>
                          Cancel
                        </button>
                        <button className="primary" type="submit" disabled={savingPurchase}>
                          {savingPurchase ? "Sending..." : "Send request"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}

              {supplierTab === "suppliers" ? (
                <div className="supplier-grid">
                  {suppliers.map((supplier) => (
                    <div key={supplier.SupplierId} className="supplier-card">
                      <div>
                        <h4>{supplier.SupplierName}</h4>
                        <p className="muted">ID: {supplier.SupplierId}</p>
                        <p className="muted">Location: {supplier.Location || ""}</p>
                        <p className="muted">Email: {supplier.Email || ""}</p>
                        <p className="muted">Phone: {supplier.PhoneNumber || ""}</p>
                      </div>
                      <div className="tag-group">
                        {(supplier.Materials || []).map((material) => (
                          <span key={material} className="tag">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-card">
                  <div className="purchase-header">
                    <div>
                      <h4>Purchase requests</h4>
                      <p className="muted">Create and track purchase requests here.</p>
                    </div>
                  </div>
                  {purchaseStatus.message ? (
                    <div className={`alert ${purchaseStatus.type}`}>{purchaseStatus.message}</div>
                  ) : null}
                  <div className="purchase-card-grid">
                    {purchaseRequests.map((request) => (
                      <article key={request.RequestId} className="purchase-card">
                        <div className="purchase-card-header">
                          <div>
                            <h5>{request.RawMaterialName}</h5>
                            <p className="muted">Supplier: {request.SupplierName}</p>
                          </div>
                          <span className={`status-pill ${String(request.Status || "pending").toLowerCase()}`}>
                            {request.Status || "Pending"}
                          </span>
                        </div>
                        <div className="purchase-card-row">
                          <div>
                            <p className="muted">Quantity</p>
                            <strong>
                              {request.RequestedQuantity} {request.Unit}
                            </strong>
                          </div>
                          <div>
                            <p className="muted">Requested</p>
                            <strong>
                              {request.CreatedAt ? String(request.CreatedAt).slice(0, 10) : ""}
                            </strong>
                          </div>
                        </div>
                        {request.Notes ? (
                          <p className="muted">Notes: {request.Notes}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                  {purchaseMaterialName ? (
                    <div className="purchase-highlight">
                      <p className="muted">Selected material</p>
                      <strong>{purchaseMaterialName}</strong>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
