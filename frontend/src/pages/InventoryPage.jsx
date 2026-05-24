import { useEffect, useState } from "react";
import ProfileMenu from "../components/ProfileMenu";
import {
  createRawMaterial,
  createSupplier,
  createStockIntake,
  createStockIssue,
  createPurchaseRequest,
  fetchPurchaseRequests,
  fetchRawMaterials,
  fetchSuppliers,
  fetchStockIssues,
  fetchStockIntakes,
  fetchSuppliersByMaterial,
  fetchFifoByMaterial
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

const initialIssueForm = {
  materialId: "",
  quantity: "",
  unit: "kg",
  issueDate: ""
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
  const [stockFlow, setStockFlow] = useState("add");
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [stockSuppliers, setStockSuppliers] = useState([]);
  const [stockStatus, setStockStatus] = useState({ type: "", message: "" });
  const [savingStock, setSavingStock] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [issueStocks, setIssueStocks] = useState([]);
  const [issueForm, setIssueForm] = useState(initialIssueForm);
  const [fifoRows, setFifoRows] = useState([]);
  const [fifoPreview, setFifoPreview] = useState({ totalCost: 0, available: 0, shortage: 0 });
  const [showIssueBreakdown, setShowIssueBreakdown] = useState(false);
  const [issueStatus, setIssueStatus] = useState({ type: "", message: "" });
  const [savingIssue, setSavingIssue] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
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
  const [expandedMaterialId, setExpandedMaterialId] = useState(null);
  const [materialFifoMap, setMaterialFifoMap] = useState({});
  const [materialFifoLoading, setMaterialFifoLoading] = useState({});

  const maxMaterialQuantity = Math.max(
    1,
    ...rawMaterials.map((item) => Number(item.CurrentQuantity) || 0)
  );

  const refreshSuppliers = async () => {
    try {
      const response = await fetchSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      setSupplierStatus({ type: "error", message: error.message });
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

  const refreshStockIssues = async () => {
    try {
      const response = await fetchStockIssues();
      setIssueStocks(response.data || []);
    } catch (error) {
      setIssueStatus({ type: "error", message: error.message });
    }
  };

  const computeFifoPreview = (rows, requestedQuantity) => {
    const target = Number(requestedQuantity) || 0;
    let remaining = target;
    let totalCost = 0;
    let available = 0;

    rows.forEach((row) => {
      const remainingQty = Number(row.RemainingQuantity) || 0;
      const unitPrice = Number(row.UnitPrice) || 0;
      available += remainingQty;

      if (remaining > 0 && remainingQty > 0) {
        const used = Math.min(remainingQty, remaining);
        totalCost += used * unitPrice;
        remaining -= used;
      }
    });

    return {
      totalCost,
      available,
      shortage: Math.max(0, target - available)
    };
  };

  const computeFifoBreakdown = (rows, requestedQuantity) => {
    const target = Number(requestedQuantity) || 0;
    let remaining = target;
    const breakdown = [];

    rows.forEach((row) => {
      if (remaining <= 0) {
        return;
      }

      const remainingQty = Number(row.RemainingQuantity) || 0;
      const unitPrice = Number(row.UnitPrice) || 0;
      if (remainingQty <= 0) {
        return;
      }

      const used = Math.min(remainingQty, remaining);
      breakdown.push({
        intakeDate: row.IntakeDate,
        used,
        unitPrice,
        lineTotal: used * unitPrice
      });
      remaining -= used;
    });

    return { breakdown, remaining };
  };

  useEffect(() => {
    if (activeSection === "raw") {
      refreshRawMaterials();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "stock") {
      refreshStockIntakes();
      refreshStockIssues();
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
      fetchPurchaseRequests()
        .then((response) => setPurchaseRequests(response.data || []))
        .catch((error) => setPurchaseStatus({ type: "error", message: error.message }));
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
    if (!isIssueModalOpen || rawMaterials.length > 0) {
      return;
    }

    fetchRawMaterials()
      .then((response) => setRawMaterials(response.data || []))
      .catch((error) => setIssueStatus({ type: "error", message: error.message }));
  }, [isIssueModalOpen, rawMaterials.length]);

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

  const handleIssueChange = (event) => {
    const { name, value } = event.target;
    setIssueForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIssueMaterialChange = (event) => {
    const materialId = event.target.value;
    const selectedMaterial = rawMaterials.find((item) => item.MaterialId === materialId);

    setIssueForm((prev) => ({
      ...prev,
      materialId,
      unit: selectedMaterial?.Unit || "kg"
    }));

    if (!materialId) {
      setFifoRows([]);
      setFifoPreview({ totalCost: 0, available: 0, shortage: 0 });
      setShowIssueBreakdown(false);
      return;
    }

    fetchFifoByMaterial(materialId)
      .then((response) => {
        const rows = response.data || [];
        setFifoRows(rows);
        setFifoPreview(computeFifoPreview(rows, issueForm.quantity));
      })
      .catch((error) => setIssueStatus({ type: "error", message: error.message }));
  };

  const handleIssueSubmit = async (event) => {
    event.preventDefault();
    setSavingIssue(true);
    setIssueStatus({ type: "", message: "" });

    try {
      const selectedMaterial = rawMaterials.find((item) => item.MaterialId === issueForm.materialId);

      if (!selectedMaterial) {
        throw new Error("Select a raw material.");
      }

      const payload = {
        materialId: selectedMaterial.MaterialId,
        materialName: selectedMaterial.MaterialName,
        quantity: issueForm.quantity,
        unit: issueForm.unit,
        issueDate: issueForm.issueDate || undefined
      };

      const response = await createStockIssue(payload);
      setIssueStocks((prev) => [response.data, ...prev]);
      setIssueForm(initialIssueForm);
      setIsIssueModalOpen(false);
      setFifoRows([]);
      setFifoPreview({ totalCost: 0, available: 0, shortage: 0 });
      setShowIssueBreakdown(false);

      const refreshed = await fetchRawMaterials();
      setRawMaterials(refreshed.data || []);
      setIssueStatus({ type: "success", message: response.message });
    } catch (error) {
      setIssueStatus({ type: "error", message: error.message });
    } finally {
      setSavingIssue(false);
    }
  };

  useEffect(() => {
    if (!isIssueModalOpen) {
      return;
    }

    setFifoPreview(computeFifoPreview(fifoRows, issueForm.quantity));
  }, [isIssueModalOpen, fifoRows, issueForm.quantity]);

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
    const targetName = String(materialName || "").trim();
    const selectedMaterial = rawMaterials.find(
      (item) => String(item.MaterialName || "").toLowerCase() === targetName.toLowerCase()
    );

    setPurchaseMaterialName(targetName);
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
        notes: purchaseForm.notes
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

  const loadMaterialFifo = async (materialId) => {
    if (!materialId) {
      return;
    }

    if (materialFifoMap[materialId]) {
      return;
    }

    setMaterialFifoLoading((prev) => ({ ...prev, [materialId]: true }));
    try {
      const response = await fetchFifoByMaterial(materialId);
      setMaterialFifoMap((prev) => ({ ...prev, [materialId]: response.data || [] }));
    } catch (error) {
      setMaterialStatus({ type: "error", message: error.message });
    } finally {
      setMaterialFifoLoading((prev) => ({ ...prev, [materialId]: false }));
    }
  };

  const toggleMaterialDetails = async (materialId) => {
    const nextId = expandedMaterialId === materialId ? null : materialId;
    setExpandedMaterialId(nextId);
    if (nextId) {
      await loadMaterialFifo(nextId);
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

              <div className="table raw-table">
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
                  <div key={item.MaterialId}>
                    <div className="table-row seven">
                      <span>{item.MaterialName}</span>
                      <span>{item.ReorderLevel}</span>
                      <span>{item.CurrentQuantity}</span>
                      <span>{item.Unit}</span>
                      <span>{item.TotalCost}</span>
                      <span className={`status-pill ${String(item.Status || "OK").toLowerCase()}`}>
                        {item.Status || "OK"}
                      </span>
                      <div className="row-actions">
                        <button
                          className="ghost action-button"
                          type="button"
                          onClick={() => toggleMaterialDetails(item.MaterialId)}
                          aria-expanded={expandedMaterialId === item.MaterialId}
                        >
                          {expandedMaterialId === item.MaterialId ? "Hide" : "Details"}
                        </button>
                        {(String(item.Status || "OK").toLowerCase() === "low" ||
                          String(item.Status || "OK").toLowerCase() === "equal") ? (
                          <button
                            className="ghost action-button"
                            type="button"
                            onClick={() => handlePurchaseAction(item.MaterialName)}
                          >
                            Order
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {expandedMaterialId === item.MaterialId ? (
                      <div className="table-row-details">
                        <div className="details-header">
                          <div>
                            <strong>Intake breakdown</strong>
                            <p className="muted">
                              FIFO remaining batches and how totals are derived.
                            </p>
                          </div>
                          <div className="details-totals">
                            <span>
                              Qty: {materialFifoMap[item.MaterialId]
                                ? materialFifoMap[item.MaterialId].reduce(
                                  (sum, row) => sum + (Number(row.RemainingQuantity) || 0),
                                  0
                                ).toFixed(2)
                                : "0.00"}
                            </span>
                            <span>
                              Total: LKR {materialFifoMap[item.MaterialId]
                                ? materialFifoMap[item.MaterialId].reduce(
                                  (sum, row) => sum +
                                    (Number(row.RemainingQuantity) || 0) * (Number(row.UnitPrice) || 0),
                                  0
                                ).toFixed(2)
                                : "0.00"}
                            </span>
                          </div>
                        </div>
                        {materialFifoLoading[item.MaterialId] ? (
                          <p className="muted">Loading intake rows...</p>
                        ) : materialFifoMap[item.MaterialId]?.length ? (
                          <div className="intake-rows">
                            {materialFifoMap[item.MaterialId].map((row) => (
                              <div key={row.FifoId} className="intake-row">
                                <span className="intake-date">
                                  {row.IntakeDate ? String(row.IntakeDate).slice(0, 10) : ""}
                                </span>
                                <span className="intake-qty">
                                  {row.RemainingQuantity} {row.Unit}
                                </span>
                                <span className="intake-price">
                                  LKR {Number(row.UnitPrice).toFixed(2)}
                                </span>
                                <span className="intake-total">
                                  LKR {(Number(row.RemainingQuantity) * Number(row.UnitPrice)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">No intake rows available.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="material-chart">
                <div className="chart-header">
                  <h4>Quantity distribution</h4>
                  <p className="muted">Current quantities by material and status.</p>
                </div>
                <div className="chart-bars">
                  {rawMaterials.map((item) => {
                    const quantity = Number(item.CurrentQuantity) || 0;
                    const barHeight = Math.max(6, (quantity / maxMaterialQuantity) * 100);
                    const status = String(item.Status || "OK").toLowerCase();

                    return (
                      <div key={`chart-${item.MaterialId}`} className="chart-bar">
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${status}`}
                            style={{ height: `${barHeight}%` }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="bar-value">{quantity}</span>
                        <span className="bar-label">{item.MaterialName}</span>
                      </div>
                    );
                  })}
                </div>
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
                {stockFlow === "add" ? (
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
                ) : stockFlow === "issue" ? (
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      setIssueStatus({ type: "", message: "" });
                      setIsIssueModalOpen(true);
                    }}
                  >
                    Issue stock
                  </button>
                ) : null}
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    refreshStockIntakes();
                    refreshStockIssues();
                  }}
                >
                  Refresh
                </button>
              </div>
              <div className="pill-row">
                <button
                  className={`pill ${stockFlow === "add" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStockFlow("add")}
                >
                  Add stock
                </button>
                <button
                  className={`pill ${stockFlow === "issue" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStockFlow("issue")}
                >
                  Issue stock
                </button>
                <button
                  className={`pill ${stockFlow === "waste" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStockFlow("waste")}
                >
                  Waste stock
                </button>
              </div>
              {stockFlow === "add" ? (
                <div className="panel-card">
                  <h4>Add Stock Intake</h4>
                  <p className="muted">Capture inbound deliveries, suppliers, and batch identifiers.</p>
                </div>
              ) : stockFlow === "issue" ? (
                <div className="panel-card">
                  <h4>Issue Stock for Production</h4>
                  <p className="muted">Release materials for production and track consumption.</p>
                </div>
              ) : (
                <div className="panel-card">
                  <h4>Waste Stock</h4>
                  <p className="muted">Log damaged or expired materials for accurate balances.</p>
                </div>
              )}

              {stockFlow === "add" && stockStatus.message ? (
                <div className={`alert ${stockStatus.type}`}>{stockStatus.message}</div>
              ) : null}
              {stockFlow === "issue" && issueStatus.message ? (
                <div className={`alert ${issueStatus.type}`}>{issueStatus.message}</div>
              ) : null}

              {stockFlow === "add" && isStockModalOpen ? (
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

              {stockFlow === "issue" && isIssueModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                  <div className="modal">
                    <div className="modal-header">
                      <div>
                        <h4>Issue stock</h4>
                        <p className="muted">Issue raw materials for production.</p>
                      </div>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => setIsIssueModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                    <form className="form material-form" onSubmit={handleIssueSubmit}>
                      <label>
                        Raw material
                        <select
                          name="materialId"
                          value={issueForm.materialId}
                          onChange={handleIssueMaterialChange}
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
                        Quantity
                        <input
                          name="quantity"
                          type="number"
                          step="0.01"
                          value={issueForm.quantity}
                          onChange={handleIssueChange}
                          required
                        />
                      </label>
                      <label>
                        Unit
                        <input name="unit" value={issueForm.unit} onChange={handleIssueChange} />
                      </label>
                      <label>
                        Date
                        <input
                          name="issueDate"
                          type="date"
                          value={issueForm.issueDate}
                          onChange={handleIssueChange}
                        />
                      </label>
                      <button
                        className="total-pill"
                        type="button"
                        onClick={() => setShowIssueBreakdown((prev) => !prev)}
                        aria-expanded={showIssueBreakdown}
                      >
                        <span>Auto total</span>
                        {fifoPreview.shortage > 0 ? (
                          <strong>Insufficient stock</strong>
                        ) : (
                          <strong>LKR {fifoPreview.totalCost.toFixed(2)}</strong>
                        )}
                      </button>
                      {showIssueBreakdown && fifoPreview.shortage === 0 ? (() => {
                        const { breakdown, remaining } = computeFifoBreakdown(
                          fifoRows,
                          issueForm.quantity
                        );
                        return (
                          <div className="fifo-breakdown">
                            <p className="muted">FIFO breakdown</p>
                            {breakdown.length === 0 ? (
                              <p className="muted">No intake rows available.</p>
                            ) : (
                              <div className="fifo-rows">
                                {breakdown.map((row, index) => (
                                  <div key={`fifo-${index}`} className="fifo-row">
                                    <span className="fifo-date">
                                      {row.intakeDate ? String(row.intakeDate).slice(0, 10) : ""}
                                    </span>
                                    <span className="fifo-math">
                                      {row.used} x LKR {row.unitPrice.toFixed(2)}
                                    </span>
                                    <span className="fifo-total">LKR {row.lineTotal.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {remaining > 0 ? (
                              <p className="muted">Shortage: {remaining}</p>
                            ) : null}
                          </div>
                        );
                      })() : null}
                      <button className="primary" type="submit" disabled={savingIssue}>
                        {savingIssue ? "Saving..." : "Issue stock"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              {stockFlow === "add" ? (
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
              ) : stockFlow === "issue" ? (
                <div className="stock-card-grid">
                  {issueStocks.map((issue) => (
                    <article key={issue.IssueId} className="stock-card">
                      <div className="stock-card-header">
                        <div>
                          <h4>{issue.MaterialName}</h4>
                          <p className="muted">Issued for production</p>
                        </div>
                        <span className="muted">
                          {issue.IssueDate ? String(issue.IssueDate).slice(0, 10) : ""}
                        </span>
                      </div>
                      <div className="stock-card-row">
                        <div>
                          <p className="muted">Quantity</p>
                          <strong>{issue.Quantity} {issue.Unit}</strong>
                        </div>
                      </div>
                      <span className="stock-total">LKR {issue.TotalCost}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="stock-card-grid">
                  <article className="stock-card">
                    <div className="stock-card-header">
                      <div>
                        <h4>Waste stock</h4>
                        <p className="muted">No waste records yet.</p>
                      </div>
                    </div>
                  </article>
                </div>
              )}
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
                <button className="ghost" type="button" onClick={refreshSuppliers}>
                  Refresh
                </button>
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
