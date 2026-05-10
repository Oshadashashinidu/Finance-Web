const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function registerCompany(payload) {
  const response = await fetch(`${API_BASE_URL}/api/companies/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Registration failed");
  }

  return data;
}

export async function loginCompany(payload) {
  const response = await fetch(`${API_BASE_URL}/api/companies/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
}

export async function fetchRawMaterials() {
  const response = await fetch(`${API_BASE_URL}/api/raw-materials`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load raw materials");
  }

  return data;
}

export async function createRawMaterial(payload) {
  const response = await fetch(`${API_BASE_URL}/api/raw-materials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create raw material");
  }

  return data;
}

export async function fetchSuppliersByMaterial(materialName) {
  const response = await fetch(
    `${API_BASE_URL}/api/suppliers?materialName=${encodeURIComponent(materialName)}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load suppliers");
  }

  return data;
}

export async function fetchStockIntakes() {
  const response = await fetch(`${API_BASE_URL}/api/stock-intakes`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load stock intakes");
  }

  return data;
}

export async function createStockIntake(payload) {
  const response = await fetch(`${API_BASE_URL}/api/stock-intakes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create stock intake");
  }

  return data;
}

export async function fetchSuppliers() {
  const response = await fetch(`${API_BASE_URL}/api/suppliers`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load suppliers");
  }

  return data;
}

export async function createSupplier(payload) {
  const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create supplier");
  }

  return data;
}

export async function createPurchaseRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/api/purchase-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create purchase request");
  }

  return data;
}

export async function fetchPurchaseRequests() {
  const response = await fetch(`${API_BASE_URL}/api/purchase-requests`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load purchase requests");
  }

  return data;
}
