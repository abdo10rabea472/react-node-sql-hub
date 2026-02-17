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
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn("📡 وضع أوفلاين - البيانات تُحفظ محلياً");
    } else {
      console.error("API Error:", error.response?.status, error.response?.data);
    }
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

// WhatsApp - في الديسكتوب نتصل بالسيرفر المحلي مباشرة
const isElectronEnv = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');
const waApi = axios.create({ baseURL: isElectronEnv ? 'http://localhost:3000' : API_URL });
// Attach token for non-electron requests
waApi.interceptors.request.use((config) => {
  if (!isElectronEnv) {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const startWhatsAppSession = () => isElectronEnv
  ? waApi.post("/start")
  : api.post("/whatsapp.php?path=start");
export const getWhatsAppStatus = () => isElectronEnv
  ? waApi.get("/status")
  : api.get("/whatsapp.php?path=status");
export const stopWhatsAppSession = () => isElectronEnv
  ? waApi.post("/stop")
  : api.post("/whatsapp.php?path=stop");
export const bootWhatsAppServer = () => isElectronEnv
  ? waApi.post("/start")
  : api.post("/whatsapp.php?path=boot");
export const sendWhatsAppMessage = (data: { phone: string; message: string }) => isElectronEnv
  ? waApi.post("/send-message", data)
  : api.post("/whatsapp.php?path=send-message", data);
export const sendWhatsAppInvoice = (data: { phone: string; invoiceText: string }) => isElectronEnv
  ? waApi.post("/send-message", { phone: data.phone, message: data.invoiceText })
  : api.post("/whatsapp.php?path=send-invoice", data);
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

// Expenses
export const getExpenses = () => api.get("/expenses.php?path=expenses");
export const createExpense = (data: any) => api.post("/expenses.php?path=expenses", data);
export const deleteExpense = (id: number) => api.delete(`/expenses.php?path=expenses&id=${id}`);

// Advances (سلف)
export const getAdvances = () => api.get("/expenses.php?path=advances");
export const getAdvancesByUser = (userId: number) => api.get(`/expenses.php?path=advances&user_id=${userId}`);
export const createAdvance = (data: any) => api.post("/expenses.php?path=advances", data);
export const updateAdvance = (id: number, data: any) => api.put(`/expenses.php?path=advances&id=${id}`, data);
export const deleteAdvance = (id: number) => api.delete(`/expenses.php?path=advances&id=${id}`);

// Attendance
export const getAttendance = (userId?: number, month?: string) => {
  let url = "/expenses.php?path=attendance";
  if (userId) url += `&user_id=${userId}`;
  if (month) url += `&month=${month}`;
  return api.get(url);
};
export const createAttendance = (data: any) => api.post("/expenses.php?path=attendance", data);
export const deleteAttendance = (id: number) => api.delete(`/expenses.php?path=attendance&id=${id}`);

// Salary Report
export const getSalaryReport = (userId: number, month: string) => api.get(`/expenses.php?path=salary-report&user_id=${userId}&month=${month}`);

// Salaries
export const getSalaries = () => api.get("/expenses.php?path=salaries");
export const createSalary = (data: any) => api.post("/expenses.php?path=salaries", data);
export const deleteSalary = (id: number) => api.delete(`/expenses.php?path=salaries&id=${id}`);

// Expense Stats
export const getExpenseStats = () => api.get("/expenses.php?path=stats");

export default api;
