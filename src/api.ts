import axios from "axios";

const API_URL = "http://localhost:3000";

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

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const verifyToken = () => api.get("/auth/verify");

// Users
export const getUsers = () => api.get("/users");
export const getStats = () => api.get("/users/stats");
export const createUser = (data: { name: string; email: string; password: string; role?: string }) =>
  api.post("/users", data);
export const updateUser = (id: number, data: Record<string, string>) =>
  api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Pricing
export const getPackages = () => api.get("/pricing");
export const createPackage = (data: any) => api.post("/pricing", data);
export const updatePackage = (id: number, data: any) => api.put(`/pricing/${id}`, data);
export const deletePackage = (id: number) => api.delete(`/pricing/${id}`);

// Settings
export const getStudioSettings = () => api.get("/settings");
export const updateStudioSettings = (data: any) => api.put("/settings", data);

// Customers
export const getCustomers = () => api.get("/customers");
export const addCustomer = (data: any) => api.post("/customers", data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

// Invoices
export const getInvoices = () => api.get("/invoices");
export const getInvoiceDetails = (id: number) => api.get(`/invoices/${id}`);
export const createInvoice = (data: {
  customer_id: number;
  items: any[];
  total_amount: number;
  paid_amount: number;
  created_by: string;
  participants?: string;
}) => api.post("/invoices", data);

export const updateInvoice = (id: number, data: any) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id: number) => api.delete(`/invoices/${id}`);

// Wedding Albums
export const getWeddingAlbums = () => api.get("/wedding-pricing/albums");
export const createWeddingAlbum = (data: any) => api.post("/wedding-pricing/albums", data);
export const updateWeddingAlbum = (id: number, data: any) => api.put(`/wedding-pricing/albums/${id}`, data);
export const deleteWeddingAlbum = (id: number) => api.delete(`/wedding-pricing/albums/${id}`);

// Wedding Videos
export const getWeddingVideos = () => api.get("/wedding-pricing/videos");
export const createWeddingVideo = (data: any) => api.post("/wedding-pricing/videos", data);
export const updateWeddingVideo = (id: number, data: any) => api.put(`/wedding-pricing/videos/${id}`, data);
export const deleteWeddingVideo = (id: number) => api.delete(`/wedding-pricing/videos/${id}`);

// Wedding Invoices
export const getWeddingInvoices = () => api.get("/wedding-invoices");
export const getWeddingInvoiceDetails = (id: number) => api.get(`/wedding-invoices/${id}`);
export const createWeddingInvoice = (data: any) => api.post("/wedding-invoices", data);
export const updateWeddingInvoice = (id: number, data: any) => api.put(`/wedding-invoices/${id}`, data);
export const deleteWeddingInvoice = (id: number) => api.delete(`/wedding-invoices/${id}`);

// WhatsApp
export const startWhatsAppSession = () => api.post("/whatsapp/start");
export const getWhatsAppStatus = () => api.get("/whatsapp/status");
export const stopWhatsAppSession = () => api.post("/whatsapp/stop");
export const sendWhatsAppMessage = (data: { phone: string; message: string }) => api.post("/whatsapp/send-message", data);
export const sendWhatsAppInvoice = (data: { phone: string; invoiceText: string }) => api.post("/whatsapp/send-invoice", data);
export const sendWhatsAppPDF = (data: { phone: string; pdfBase64: string; fileName: string; caption: string }) => api.post("/whatsapp/send-invoice-pdf", data);
export const sendWhatsAppPDFFromDocDef = (data: { phone: string; docDefinition: any; fileName: string; caption: string }) => api.post("/whatsapp/send-pdf-from-docdef", data);

// Purchases (legacy)
export const getPurchases = () => api.get("/purchases");
export const getPurchasesStats = () => api.get("/purchases/stats");
export const createPurchase = (data: any) => api.post("/purchases", data);
export const updatePurchase = (id: number, data: any) => api.put(`/purchases/${id}`, data);
export const deletePurchase = (id: number) => api.delete(`/purchases/${id}`);

// Inventory
export const getInventoryItems = () => api.get("/inventory");
export const getInventoryStats = () => api.get("/inventory/stats");
export const createInventoryItem = (data: any) => api.post("/inventory", data);
export const updateInventoryItem = (id: number, data: any) => api.put(`/inventory/${id}`, data);
export const deleteInventoryItem = (id: number) => api.delete(`/inventory/${id}`);
export const addStock = (id: number, data: any) => api.post(`/inventory/${id}/add-stock`, data);
export const adjustStock = (id: number, data: any) => api.post(`/inventory/${id}/adjust`, data);
export const getInventoryCategories = () => api.get("/inventory/categories");
export const createInventoryCategory = (data: any) => api.post("/inventory/categories", data);
export const updateInventoryCategory = (id: number, data: any) => api.put(`/inventory/categories/${id}`, data);
export const deleteInventoryCategory = (id: number) => api.delete(`/inventory/categories/${id}`);
// Package materials removed - no longer used
export const getInventoryTransactions = (itemId: number) => api.get(`/inventory/transactions/${itemId}`);

export default api;
