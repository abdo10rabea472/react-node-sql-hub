import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://eltahan.vip472.com/api";

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a route-not-found type error, try the direct PHP file approach
    console.error("API Error:", error?.response?.status, error?.response?.data);
    return Promise.reject(error);
  },
);

// Auth
export const login = (email: string, password: string) => api.post("/auth.php?path=login", { email, password });

export const verifyToken = () => api.get("/auth.php?path=verify");

// Users
export const getUsers = () => api.get("/users.php");
export const getStats = () => api.get("/users.php?path=stats");
export const createUser = (data: { name: string; email: string; password: string; role?: string }) =>
  api.post("/users.php", data);
export const updateUser = (id: number, data: Record<string, string>) => api.put(`/users.php?id=${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users.php?id=${id}`);

// Pricing
export const getPackages = () => api.get("/pricing.php");
export const createPackage = (data: any) => api.post("/pricing.php", data);
export const updatePackage = (id: number, data: any) => api.put(`/pricing.php?id=${id}`, data);
export const deletePackage = (id: number) => api.delete(`/pricing.php?id=${id}`);

// Settings
export const getStudioSettings = () => api.get("/settings.php");
export const updateStudioSettings = (data: any) => api.put("/settings.php", data);

// Customers
export const getCustomers = () => api.get("/customers.php");
export const addCustomer = (data: any) => api.post("/customers.php", data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers.php?id=${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers.php?id=${id}`);

// Invoices
export const getInvoices = () => api.get("/invoices.php");
export const getInvoiceDetails = (id: number) => api.get(`/invoices.php?id=${id}`);
export const createInvoice = (data: {
  customer_id: number;
  items: any[];
  total_amount: number;
  paid_amount: number;
  created_by: string;
  participants?: string;
}) => api.post("/invoices.php", data);

export const updateInvoice = (id: number, data: any) => api.put(`/invoices.php?id=${id}`, data);
export const deleteInvoice = (id: number) => api.delete(`/invoices.php?id=${id}`);

// Wedding Albums
export const getWeddingAlbums = () => api.get("/weddingPricing.php?path=albums");
export const createWeddingAlbum = (data: any) => api.post("/weddingPricing.php?path=albums", data);
export const updateWeddingAlbum = (id: number, data: any) => api.put(`/weddingPricing.php?path=albums&id=${id}`, data);
export const deleteWeddingAlbum = (id: number) => api.delete(`/weddingPricing.php?path=albums&id=${id}`);

// Wedding Videos
export const getWeddingVideos = () => api.get("/weddingPricing.php?path=videos");
export const createWeddingVideo = (data: any) => api.post("/weddingPricing.php?path=videos", data);
export const updateWeddingVideo = (id: number, data: any) => api.put(`/weddingPricing.php?path=videos&id=${id}`, data);
export const deleteWeddingVideo = (id: number) => api.delete(`/weddingPricing.php?path=videos&id=${id}`);

// Wedding Invoices
export const getWeddingInvoices = () => api.get("/weddingInvoices.php");
export const getWeddingInvoiceDetails = (id: number) => api.get(`/weddingInvoices.php?id=${id}`);
export const createWeddingInvoice = (data: any) => api.post("/weddingInvoices.php", data);
export const updateWeddingInvoice = (id: number, data: any) => api.put(`/weddingInvoices.php?id=${id}`, data);
export const deleteWeddingInvoice = (id: number) => api.delete(`/weddingInvoices.php?id=${id}`);

// WhatsApp
export const startWhatsAppSession = () => api.post("/whatsapp.php?path=start");
export const getWhatsAppStatus = () => api.get("/whatsapp.php?path=status");
export const stopWhatsAppSession = () => api.post("/whatsapp.php?path=stop");
export const sendWhatsAppMessage = (data: { phone: string; message: string }) =>
  api.post("/whatsapp.php?path=send-message", data);
export const sendWhatsAppInvoice = (data: { phone: string; invoiceText: string }) =>
  api.post("/whatsapp.php?path=send-invoice", data);
export const sendWhatsAppPDF = (data: { phone: string; pdfBase64: string; fileName: string; caption: string }) =>
  api.post("/whatsapp.php?path=send-invoice-pdf", data);
export const sendWhatsAppPDFFromDocDef = (data: {
  phone: string;
  docDefinition: any;
  fileName: string;
  caption: string;
}) => api.post("/whatsapp.php?path=send-pdf-from-docdef", data);

// Purchases (legacy)
export const getPurchases = () => api.get("/purchases.php");
export const getPurchasesStats = () => api.get("/purchases.php?path=stats");
export const createPurchase = (data: any) => api.post("/purchases.php", data);
export const updatePurchase = (id: number, data: any) => api.put(`/purchases.php?id=${id}`, data);
export const deletePurchase = (id: number) => api.delete(`/purchases.php?id=${id}`);

// Inventory
export const getInventoryItems = () => api.get("/inventory.php");
export const getInventoryStats = () => api.get("/inventory.php?path=stats");
export const createInventoryItem = (data: any) => api.post("/inventory.php", data);
export const updateInventoryItem = (id: number, data: any) => api.put(`/inventory.php?id=${id}`, data);
export const deleteInventoryItem = (id: number) => api.delete(`/inventory.php?id=${id}`);
export const addStock = (id: number, data: any) => api.post(`/inventory.php?path=add-stock&id=${id}`, data);
export const adjustStock = (id: number, data: any) => api.post(`/inventory.php?path=adjust&id=${id}`, data);
export const getInventoryCategories = () => api.get("/inventory.php?path=categories");
export const createInventoryCategory = (data: any) => api.post("/inventory.php?path=categories", data);
export const updateInventoryCategory = (id: number, data: any) =>
  api.put(`/inventory.php?path=categories&id=${id}`, data);
export const deleteInventoryCategory = (id: number) => api.delete(`/inventory.php?path=categories&id=${id}`);
export const getPackageMaterials = (packageId: number, packageType: string) =>
  api.get(`/inventory.php?path=materials&packageId=${packageId}&packageType=${packageType}`);
export const setPackageMaterials = (packageId: number, packageType: string, materials: any[]) =>
  api.post(`/inventory.php?path=materials&packageId=${packageId}&packageType=${packageType}`, { materials });
export const getInventoryTransactions = (itemId: number) =>
  api.get(`/inventory.php?path=transactions&itemId=${itemId}`);

export default api;
