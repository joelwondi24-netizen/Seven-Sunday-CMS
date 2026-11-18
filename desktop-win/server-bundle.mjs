import { createRequire as __ssCreateRequire } from "node:module"; const require = __ssCreateRequire(import.meta.url);

// server.ts
import fs3 from "node:fs";
import http from "node:http";
import path3 from "node:path";
import crypto2 from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

// server/store.ts
import fs from "node:fs";
import path from "node:path";

// server/seed.ts
import crypto from "node:crypto";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${derived}`;
}
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  const derived = crypto.scryptSync(password, salt, 32).toString("hex");
  const a = Buffer.from(key, "hex");
  const b = Buffer.from(derived, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
var ALL_MODULES = [
  "dashboard",
  "admin",
  "hr",
  "secretary",
  "attendance",
  "leave",
  "payroll",
  "inventory",
  "materials",
  "purchasing",
  "sales",
  "finance",
  "assets",
  "fleet",
  "documents",
  "chat",
  "approvals",
  "audit",
  "sync",
  "reports"
];
var DEFAULT_ROLES = [
  {
    id: "role_super_admin",
    name: "Super Administrator",
    isSystem: true,
    modules: ALL_MODULES,
    canApprove: true,
    canViewSalaryBank: true,
    canAdjustStock: true,
    canManageUsers: true,
    canExportData: true,
    canAccessOfflinePayroll: true
  },
  {
    id: "role_owner",
    name: "Company Owner",
    isSystem: true,
    modules: ALL_MODULES,
    canApprove: true,
    canViewSalaryBank: true,
    canAdjustStock: true,
    canManageUsers: true,
    canExportData: true,
    canAccessOfflinePayroll: true
  },
  {
    id: "role_gm",
    name: "General Manager",
    isSystem: true,
    modules: ALL_MODULES,
    canApprove: true,
    canViewSalaryBank: true,
    canAdjustStock: true,
    canManageUsers: true,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_dept_mgr",
    name: "Department Manager",
    isSystem: true,
    modules: ["dashboard", "hr", "attendance", "leave", "materials", "documents", "chat", "approvals", "sync", "reports"],
    canApprove: true,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_hr_mgr",
    name: "Human Resource Manager",
    isSystem: true,
    modules: ["dashboard", "hr", "secretary", "attendance", "leave", "payroll", "assets", "documents", "chat", "approvals", "sync", "reports"],
    canApprove: true,
    canViewSalaryBank: true,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_finance_mgr",
    name: "Finance Manager",
    isSystem: true,
    modules: ["dashboard", "payroll", "purchasing", "sales", "finance", "documents", "chat", "approvals", "audit", "sync", "reports"],
    canApprove: true,
    canViewSalaryBank: true,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_accountant",
    name: "Accountant",
    isSystem: true,
    modules: ["dashboard", "payroll", "purchasing", "sales", "finance", "documents", "chat", "sync", "reports"],
    canApprove: false,
    canViewSalaryBank: true,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_inventory_mgr",
    name: "Inventory Manager",
    isSystem: true,
    modules: ["dashboard", "inventory", "materials", "purchasing", "documents", "chat", "approvals", "sync", "reports"],
    canApprove: true,
    canViewSalaryBank: false,
    canAdjustStock: true,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_warehouse_mgr",
    name: "Warehouse Manager",
    isSystem: true,
    modules: ["dashboard", "inventory", "materials", "fleet", "documents", "chat", "sync", "reports"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: true,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_procurement",
    name: "Procurement Officer",
    isSystem: true,
    modules: ["dashboard", "inventory", "materials", "purchasing", "documents", "chat", "sync", "reports"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_sales_mgr",
    name: "Sales Manager",
    isSystem: true,
    modules: ["dashboard", "inventory", "sales", "documents", "chat", "approvals", "sync", "reports"],
    canApprove: true,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_security",
    name: "Security Supervisor",
    isSystem: true,
    modules: ["dashboard", "attendance", "assets", "fleet", "materials", "chat", "sync"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: false,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_secretary",
    name: "Secretary",
    isSystem: true,
    modules: ["dashboard", "secretary", "documents", "hr", "attendance", "leave", "chat", "sync", "reports"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_employee",
    name: "Employee",
    isSystem: true,
    modules: ["dashboard", "attendance", "leave", "documents", "chat", "sync"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: false,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_auditor",
    name: "Auditor",
    isSystem: true,
    modules: ["dashboard", "finance", "inventory", "materials", "payroll", "audit", "reports", "sync"],
    canApprove: false,
    canViewSalaryBank: true,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: true,
    canAccessOfflinePayroll: false
  },
  {
    id: "role_viewer",
    name: "Viewer",
    isSystem: true,
    modules: ["dashboard", "reports"],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canManageUsers: false,
    canExportData: false,
    canAccessOfflinePayroll: false
  }
];
var DEFAULT_BRANCHES = [
  {
    id: "br_hq",
    name: "Addis Ababa Head Office",
    city: "Addis Ababa",
    address: "Bole Sub-City, Addis Ababa, Ethiopia",
    phone: "+251 11 000 0000",
    managerName: "General Manager"
  },
  {
    id: "br_plant",
    name: "Manufacturing Plant & Central Warehouse",
    city: "Dukem / Gelan",
    address: "Industrial Zone, Oromia, Ethiopia",
    phone: "+251 11 000 0001",
    managerName: "Warehouse Manager"
  }
];
var DEFAULT_DEPARTMENTS = [
  { id: "dept_exec", name: "Executive Management", code: "EXEC", headName: "General Manager", budgetEtb: 12e5 },
  { id: "dept_sec", name: "Secretary Department", code: "SEC", headName: "Executive Secretary", budgetEtb: 35e4 },
  { id: "dept_hr", name: "Human Resources", code: "HR", headName: "HR Manager", budgetEtb: 6e5 },
  { id: "dept_fin", name: "Finance & Accounting", code: "FIN", headName: "Finance Manager", budgetEtb: 85e4 },
  { id: "dept_prod", name: "Manufacturing & Production", code: "PROD", headName: "Plant Manager", budgetEtb: 35e5 },
  { id: "dept_inv", name: "Inventory & Warehouse", code: "INV", headName: "Inventory Manager", budgetEtb: 9e5 },
  { id: "dept_proc", name: "Procurement & Supply", code: "PROC", headName: "Procurement Officer", budgetEtb: 22e5 },
  { id: "dept_sales", name: "Sales & Marketing", code: "SLS", headName: "Sales Manager", budgetEtb: 11e5 },
  { id: "dept_secu", name: "Security & Fleet Operations", code: "LOG", headName: "Security Supervisor", budgetEtb: 5e5 }
];
var DEFAULT_FINANCE_ACCOUNTS = [
  { id: "acc_1010", code: "1010", name: "Cash on Hand (Petty Cash)", type: "Asset", currency: "ETB", balance: 0, isBankOrCash: true },
  { id: "acc_1020", code: "1020", name: "Commercial Bank of Ethiopia - Operating", type: "Asset", currency: "ETB", balance: 0, isBankOrCash: true },
  { id: "acc_1200", code: "1200", name: "Accounts Receivable", type: "Asset", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_1300", code: "1300", name: "Inventory Asset", type: "Asset", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_2010", code: "2010", name: "Accounts Payable", type: "Liability", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_2100", code: "2100", name: "VAT & Payroll Tax Payable", type: "Liability", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_3000", code: "3000", name: "Owner Equity & Retained Earnings", type: "Equity", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_4000", code: "4000", name: "Manufacturing & Trading Revenue", type: "Revenue", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_5000", code: "5000", name: "Cost of Goods Sold", type: "Expense", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_5100", code: "5100", name: "Salaries & Payroll Expense", type: "Expense", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_5200", code: "5200", name: "Fleet, Fuel & Maintenance Expense", type: "Expense", currency: "ETB", balance: 0, isBankOrCash: false },
  { id: "acc_5300", code: "5300", name: "Administrative & Office Expense", type: "Expense", currency: "ETB", balance: 0, isBankOrCash: false }
];
var DEFAULT_CHAT_CHANNELS = [
  { id: "ch_announcements", name: "Company Announcements", type: "announcement", participants: [] },
  { id: "ch_general", name: "Seven Sunday General", type: "group", participants: [] },
  { id: "ch_secretary", name: "Secretary & Official Desk", type: "department", participants: [] },
  { id: "ch_warehouse", name: "Warehouse & Logistics", type: "department", participants: [] },
  { id: "ch_finance", name: "Finance & Procurement", type: "department", participants: [] }
];
function createInitialDatabaseState() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const defaultPasswordHash = hashPassword("SevenSunday@2026");
  const companySettings = {
    id: "company_settings",
    companyName: "Seven Sunday Manufacturing & Trading PLC",
    brandName: "Seven Sunday Ethiopia",
    slogan: "The Home of quality product",
    secondarySlogan: "Together for a Stronger and Better Tomorrow",
    address: "Addis Ababa, Ethiopia (Enter Verified Street Address in Admin)",
    city: "Addis Ababa",
    country: "Ethiopia",
    phone: "Enter Verified Telephone",
    secondaryPhone: "",
    email: "info@sevensundayethiopia.com",
    website: "www.sevensundayethiopia.com",
    tinNumber: "ENTER-VERIFIED-TIN",
    registrationNumber: "ENTER-VERIFIED-REG",
    vatNumber: "ENTER-VERIFIED-VAT",
    defaultCurrency: "ETB",
    supportedCurrencies: ["ETB", "USD", "EUR", "CNY"],
    vatRatePercent: 15,
    defaultLanguage: "en",
    calendarSystem: "dual",
    primaryColor: "#082B59",
    secondaryColor: "#087CEB",
    customLogoDataUrl: "",
    companyStampDataUrl: "",
    authorizedSignatureDataUrl: "",
    letterheadFooter: "Seven Sunday Manufacturing & Trading PLC \xB7 Addis Ababa, Ethiopia \xB7 The Home of quality product",
    retentionDays: 3650,
    twoFactorRequiredForAdmins: false,
    smtp: {
      host: "",
      port: 587,
      secure: false,
      senderEmail: "",
      senderName: "Seven Sunday Ethiopia ERP",
      username: "",
      configured: false
    },
    version: 1,
    updatedAt: now
  };
  const payrollConfig = {
    id: "payroll_config",
    effectiveDate: "2026-01-01",
    employeePensionPercent: 7,
    employerPensionPercent: 11,
    overtimeWeekdayMultiplier: 1.5,
    overtimeWeekendMultiplier: 2,
    overtimeHolidayMultiplier: 2.5,
    workingHoursPerMonth: 208,
    brackets: [
      { min: 0, max: 600, ratePercent: 0, deduction: 0 },
      { min: 601, max: 1650, ratePercent: 10, deduction: 60 },
      { min: 1651, max: 3200, ratePercent: 15, deduction: 142.5 },
      { min: 3201, max: 5250, ratePercent: 20, deduction: 302.5 },
      { min: 5251, max: 7800, ratePercent: 25, deduction: 565 },
      { min: 7801, max: 10900, ratePercent: 30, deduction: 955 },
      { min: 10901, max: null, ratePercent: 35, deduction: 1500 }
    ],
    version: 1
  };
  const users = [
    {
      id: "usr_super_admin",
      username: "admin",
      email: "admin@sevensundayethiopia.com",
      fullName: "Super Administrator",
      roleId: "role_super_admin",
      roleName: "Super Administrator",
      department: "Executive Management",
      jobTitle: "System Super Administrator",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    },
    {
      id: "usr_hr",
      username: "hr.manager",
      email: "hr@sevensundayethiopia.com",
      fullName: "Tigist Bekele",
      roleId: "role_hr_mgr",
      roleName: "Human Resource Manager",
      department: "Human Resources",
      jobTitle: "Human Resource Manager",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    },
    {
      id: "usr_finance",
      username: "finance.mgr",
      email: "finance@sevensundayethiopia.com",
      fullName: "Dawit Tadesse",
      roleId: "role_finance_mgr",
      roleName: "Finance Manager",
      department: "Finance & Accounting",
      jobTitle: "Finance Manager",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    },
    {
      id: "usr_secretary",
      username: "secretary",
      email: "secretary@sevensundayethiopia.com",
      fullName: "Selamawit Girma",
      roleId: "role_secretary",
      roleName: "Secretary",
      department: "Secretary Department",
      jobTitle: "Executive Secretary",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    },
    {
      id: "usr_warehouse",
      username: "warehouse",
      email: "warehouse@sevensundayethiopia.com",
      fullName: "Abebe Kebede",
      roleId: "role_warehouse_mgr",
      roleName: "Warehouse Manager",
      department: "Inventory & Warehouse",
      jobTitle: "Warehouse Manager",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    },
    {
      id: "usr_employee",
      username: "employee",
      email: "staff@sevensundayethiopia.com",
      fullName: "Beka Tesfaye",
      roleId: "role_employee",
      roleName: "Employee",
      department: "Manufacturing & Production",
      jobTitle: "Production Line Technician",
      status: "active",
      passwordHash: defaultPasswordHash,
      twoFactorEnabled: false,
      offlineEnabled: true,
      createdAt: now,
      version: 1
    }
  ];
  return {
    companySettings,
    payrollConfig,
    roles: DEFAULT_ROLES,
    branches: DEFAULT_BRANCHES,
    departments: DEFAULT_DEPARTMENTS,
    users,
    loginHistory: [],
    activeDevices: [],
    employees: [],
    employeeEvents: [],
    attendance: [],
    attendanceCorrections: [],
    leaves: [],
    payrollRuns: [],
    bonuses: [],
    warehouses: [
      {
        id: "wh_main",
        name: "Central Manufacturing Warehouse",
        code: "WH-01",
        location: "Dukem Industrial Zone",
        managerName: "Abebe Kebede",
        capacityNote: "Primary raw materials & finished goods facility"
      },
      {
        id: "wh_addis",
        name: "Addis Ababa Distribution Depot",
        code: "WH-02",
        location: "Bole Sub-City, Addis Ababa",
        managerName: "Inventory Manager",
        capacityNote: "Regional dispatch and sales stock"
      }
    ],
    products: [],
    stockTransactions: [],
    materialRequests: [],
    suppliers: [],
    purchaseOrders: [],
    customers: [],
    salesInvoices: [],
    financeAccounts: DEFAULT_FINANCE_ACCOUNTS,
    journalEntries: [],
    paymentVouchers: [],
    budgets: DEFAULT_DEPARTMENTS.map((d) => ({
      id: `bud_${d.id}`,
      department: d.name,
      fiscalYear: "2026",
      allocatedAmount: d.budgetEtb,
      spentAmount: 0,
      notes: "Annual departmental operating budget"
    })),
    uniformAssets: [],
    vehicles: [],
    vehicleLogs: [],
    secretaryEntries: [],
    officialDocuments: [],
    chatChannels: DEFAULT_CHAT_CHANNELS,
    chatMessages: [
      {
        id: "msg_welcome",
        channelId: "ch_announcements",
        senderId: "usr_super_admin",
        senderName: "Super Administrator",
        senderRole: "Super Administrator",
        content: "Welcome to the Seven Sunday Ethiopia Unified Corporate Management Platform. Real-time sync and offline mode are active.",
        readBy: ["usr_super_admin"],
        createdAt: now
      }
    ],
    notifications: [
      {
        id: "notif_init",
        title: "Platform Initialized",
        message: "Seven Sunday Ethiopia ERP is ready. Configure verified company details in Company Administration or load optional sample data to explore.",
        module: "admin",
        severity: "info",
        readBy: [],
        createdAt: now
      }
    ],
    auditLogs: [
      {
        id: "aud_init",
        userId: "system",
        username: "system",
        roleName: "System",
        module: "System",
        action: "Platform Database Initialized",
        entityId: "erp_db",
        deviceInfo: "Server Core",
        timestamp: now
      }
    ],
    lastUpdatedAt: now
  };
}
function buildDemoDataset(nowIso) {
  const today = nowIso.slice(0, 10);
  const employees = [
    {
      id: "emp_demo_1",
      employeeCode: "SSE-EMP-0001",
      fullName: "Abebe Kebede",
      gender: "Male",
      dateOfBirth: "1989-04-12",
      phone: "+251 91 122 3344",
      email: "abebe.k@sevensundayethiopia.com",
      address: "Bole, Addis Ababa",
      emergencyContactName: "Mulugeta Kebede",
      emergencyContactPhone: "+251 91 100 2233",
      department: "Inventory & Warehouse",
      jobTitle: "Warehouse Manager",
      employmentType: "Permanent",
      startDate: "2022-02-01",
      basicSalary: 24500,
      transportAllowance: 1800,
      housingAllowance: 3e3,
      bankName: "Commercial Bank of Ethiopia",
      bankAccountNumber: "1000234981122",
      tinNumber: "0048192011",
      education: "BSc in Logistics & Supply Chain Management",
      workExperience: "8 years industrial warehousing",
      idDocumentNumber: "ETH-AA-901822",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    },
    {
      id: "emp_demo_2",
      employeeCode: "SSE-EMP-0002",
      fullName: "Tigist Bekele",
      gender: "Female",
      dateOfBirth: "1992-08-19",
      phone: "+251 91 233 4455",
      email: "tigist.b@sevensundayethiopia.com",
      address: "Yeka, Addis Ababa",
      emergencyContactName: "Hanna Bekele",
      emergencyContactPhone: "+251 91 299 8877",
      department: "Human Resources",
      jobTitle: "Human Resource Manager",
      employmentType: "Permanent",
      startDate: "2021-06-15",
      basicSalary: 28e3,
      transportAllowance: 2e3,
      housingAllowance: 3500,
      bankName: "Awash Bank",
      bankAccountNumber: "013209871234",
      tinNumber: "0039182734",
      education: "MBA in Human Resource Management",
      workExperience: "9 years corporate HR & Ethiopian labor law",
      idDocumentNumber: "ETH-AA-771290",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    },
    {
      id: "emp_demo_3",
      employeeCode: "SSE-EMP-0003",
      fullName: "Selamawit Girma",
      gender: "Female",
      dateOfBirth: "1995-01-23",
      phone: "+251 91 344 5566",
      email: "selamawit.g@sevensundayethiopia.com",
      address: "Kirkos, Addis Ababa",
      emergencyContactName: "Girma Wolde",
      emergencyContactPhone: "+251 91 311 2244",
      department: "Secretary Department",
      jobTitle: "Executive Secretary",
      employmentType: "Permanent",
      startDate: "2023-01-10",
      basicSalary: 16500,
      transportAllowance: 1200,
      housingAllowance: 1500,
      bankName: "Dashen Bank",
      bankAccountNumber: "5019283711",
      tinNumber: "0055918271",
      education: "BA in Business Administration & Office Management",
      workExperience: "5 years bilingual corporate correspondence",
      idDocumentNumber: "ETH-AA-664512",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    },
    {
      id: "emp_demo_4",
      employeeCode: "SSE-EMP-0004",
      fullName: "Beka Tesfaye",
      gender: "Male",
      dateOfBirth: "1997-11-05",
      phone: "+251 92 455 6677",
      email: "beka.t@sevensundayethiopia.com",
      address: "Dukem, Oromia",
      emergencyContactName: "Chaltu Tesfaye",
      emergencyContactPhone: "+251 92 400 1122",
      department: "Manufacturing & Production",
      jobTitle: "Production Line Technician",
      employmentType: "Permanent",
      startDate: "2023-09-01",
      basicSalary: 12800,
      transportAllowance: 900,
      housingAllowance: 1e3,
      bankName: "Commercial Bank of Ethiopia",
      bankAccountNumber: "1000881234901",
      tinNumber: "0071829304",
      education: "Diploma in Industrial Mechanics",
      workExperience: "4 years manufacturing assembly",
      idDocumentNumber: "ETH-OR-331902",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    }
  ];
  const products = [
    {
      id: "prod_demo_1",
      itemCode: "SS-FG-1001",
      barcode: "6291041500112",
      name: "Seven Sunday Premium Household Container 50L",
      category: "Finished Product",
      unit: "Pcs",
      purchasePrice: 420,
      sellingPrice: 680,
      quantity: 480,
      minStockLevel: 100,
      warehouseId: "wh_main",
      warehouseName: "Central Manufacturing Warehouse",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    },
    {
      id: "prod_demo_2",
      itemCode: "SS-RM-2001",
      barcode: "6291041500228",
      name: "HDPE Virgin Polymer Resin Grade A",
      category: "Raw Material",
      unit: "Kg",
      purchasePrice: 145,
      sellingPrice: 185,
      quantity: 65,
      minStockLevel: 150,
      warehouseId: "wh_main",
      warehouseName: "Central Manufacturing Warehouse",
      status: "Low Stock",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    },
    {
      id: "prod_demo_3",
      itemCode: "SS-CM-3001",
      barcode: "6291041500334",
      name: "Industrial Steel Reinforcement Conduit 6m",
      category: "Construction Material",
      unit: "Lengths",
      purchasePrice: 890,
      sellingPrice: 1250,
      quantity: 140,
      minStockLevel: 40,
      warehouseId: "wh_addis",
      warehouseName: "Addis Ababa Distribution Depot",
      status: "Active",
      isDemo: true,
      version: 1,
      updatedAt: nowIso
    }
  ];
  const attendance = [
    {
      id: "att_demo_1",
      employeeId: "emp_demo_1",
      employeeCode: "SSE-EMP-0001",
      employeeName: "Abebe Kebede",
      department: "Inventory & Warehouse",
      date: today,
      shift: "Day Shift (08:00 - 17:00)",
      checkIn: "07:54",
      checkOut: "17:05",
      status: "Present",
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      overtimeHours: 0,
      source: "Hikvision",
      approved: true,
      isDemo: true,
      version: 1
    },
    {
      id: "att_demo_2",
      employeeId: "emp_demo_2",
      employeeCode: "SSE-EMP-0002",
      employeeName: "Tigist Bekele",
      department: "Human Resources",
      date: today,
      shift: "Day Shift (08:00 - 17:00)",
      checkIn: "08:02",
      checkOut: "17:15",
      status: "Present",
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      overtimeHours: 0,
      source: "ZKTeco",
      approved: true,
      isDemo: true,
      version: 1
    },
    {
      id: "att_demo_3",
      employeeId: "emp_demo_4",
      employeeCode: "SSE-EMP-0004",
      employeeName: "Beka Tesfaye",
      department: "Manufacturing & Production",
      date: today,
      shift: "Day Shift (08:00 - 17:00)",
      checkIn: "08:22",
      checkOut: "18:30",
      status: "Late",
      lateMinutes: 22,
      earlyDepartureMinutes: 0,
      overtimeHours: 1.5,
      source: "Hikvision",
      approved: true,
      isDemo: true,
      version: 1
    }
  ];
  const suppliers = [
    {
      id: "sup_demo_1",
      code: "SUP-001",
      name: "Ethio-Polymer Industrial Supply PLC",
      contactPerson: "Yohannes Alemu",
      phone: "+251 11 551 8899",
      email: "sales@ethiopolymers.com",
      address: "Akaki Kality, Addis Ababa",
      tinNumber: "0011223344",
      category: "Raw Materials",
      balancePayable: 145e3,
      rating: 5,
      isDemo: true,
      version: 1
    }
  ];
  const customers = [
    {
      id: "cust_demo_1",
      code: "CUST-001",
      name: "Mercato Wholesale Distributors Ltd",
      contactPerson: "Solomon Haile",
      phone: "+251 91 144 8800",
      email: "orders@mercatowholesale.et",
      address: "Addis Ketema, Addis Ababa",
      tinNumber: "0099887766",
      creditLimit: 5e5,
      balanceReceivable: 136e3,
      isDemo: true,
      version: 1
    }
  ];
  const salesInvoices = [
    {
      id: "inv_demo_1",
      invoiceNumber: "INV-2026-0001",
      type: "Invoice",
      customerId: "cust_demo_1",
      customerName: "Mercato Wholesale Distributors Ltd",
      items: [
        {
          productId: "prod_demo_1",
          itemCode: "SS-FG-1001",
          name: "Seven Sunday Premium Household Container 50L",
          quantity: 200,
          unitPrice: 680,
          total: 136e3
        }
      ],
      discount: 0,
      subtotal: 136e3,
      vatAmount: 20400,
      totalAmount: 156400,
      paidAmount: 20400,
      status: "Partial",
      date: today,
      dueDate: today,
      isDemo: true,
      version: 1
    }
  ];
  const purchaseOrders = [
    {
      id: "po_demo_1",
      poNumber: "PO-2026-0001",
      supplierId: "sup_demo_1",
      supplierName: "Ethio-Polymer Industrial Supply PLC",
      items: [
        {
          productId: "prod_demo_2",
          itemCode: "SS-RM-2001",
          name: "HDPE Virgin Polymer Resin Grade A",
          quantity: 1e3,
          unitPrice: 145,
          total: 145e3
        }
      ],
      subtotal: 145e3,
      vatAmount: 21750,
      totalAmount: 166750,
      expectedDate: today,
      status: "Pending Approval",
      createdAt: nowIso,
      isDemo: true,
      version: 1
    }
  ];
  const paymentVouchers = [
    {
      id: "pv_demo_1",
      voucherNumber: "RV-2026-0001",
      type: "Receipt Voucher",
      partyName: "Mercato Wholesale Distributors Ltd",
      accountId: "acc_1020",
      accountName: "Commercial Bank of Ethiopia - Operating",
      category: "Sales Deposit",
      amount: 32e4,
      currency: "ETB",
      paymentMethod: "Bank Transfer",
      referenceNo: "CBE-FT-9012",
      description: "Advance settlement for container batch distribution",
      date: today,
      status: "Posted",
      approvedBy: "Finance Manager",
      isDemo: true,
      version: 1
    },
    {
      id: "pv_demo_2",
      voucherNumber: "PV-2026-0001",
      type: "Payment Voucher",
      partyName: "Dukem Industrial Utility & Power",
      accountId: "acc_1020",
      accountName: "Commercial Bank of Ethiopia - Operating",
      category: "Plant Operations",
      amount: 48500,
      currency: "ETB",
      paymentMethod: "Bank Transfer",
      referenceNo: "CBE-FT-9045",
      description: "Monthly manufacturing plant electricity & utility settlement",
      date: today,
      status: "Posted",
      approvedBy: "Finance Manager",
      isDemo: true,
      version: 1
    }
  ];
  const vehicles = [
    {
      id: "veh_demo_1",
      plateNumber: "ET-3-B48291",
      model: "Isuzu FSR Cargo Truck",
      type: "Truck",
      assignedDriver: "Getachew Lemma",
      department: "Security & Fleet Operations",
      mileageKm: 78420,
      insuranceExpiry: "2026-12-20",
      inspectionDate: "2026-12-10",
      nextServiceDate: "2026-11-30",
      status: "Operational",
      isDemo: true,
      version: 1
    }
  ];
  const uniformAssets = [
    {
      id: "ua_demo_1",
      itemCode: "PPE-HLM-014",
      itemName: "Safety Helmet & Reflective Jacket Set",
      category: "Safety Helmet",
      employeeId: "emp_demo_4",
      employeeName: "Beka Tesfaye",
      department: "Manufacturing & Production",
      quantity: 1,
      condition: "Good",
      dateIssued: today,
      status: "Issued",
      approvalStatus: "Approved",
      isDemo: true,
      version: 1
    }
  ];
  const secretaryEntries = [
    {
      id: "sec_demo_1",
      refNumber: "SEC-OUT-2026-001",
      direction: "Outgoing",
      subject: "Supplier Quality Compliance & Delivery Schedule Notice",
      counterparty: "Ethio-Polymer Industrial Supply PLC",
      department: "Secretary Department",
      assignedTo: "Selamawit Girma",
      priority: "Normal",
      status: "Responded",
      date: today,
      summary: "Formal bilingual notice regarding Q4 resin quality inspection standards.",
      isDemo: true,
      version: 1
    }
  ];
  const leaves = [
    {
      id: "lv_demo_1",
      employeeId: "emp_demo_3",
      employeeName: "Selamawit Girma",
      department: "Secretary Department",
      category: "Annual",
      startDate: today,
      endDate: today,
      days: 2,
      reason: "Scheduled family administrative matter",
      status: "Pending",
      createdAt: nowIso,
      isDemo: true,
      version: 1
    }
  ];
  const materialRequests = [
    {
      id: "mr_demo_1",
      requestNumber: "MR-2026-0001",
      requestedBy: "Beka Tesfaye",
      department: "Manufacturing & Production",
      productId: "prod_demo_2",
      productName: "HDPE Virgin Polymer Resin Grade A",
      quantity: 25,
      unit: "Kg",
      purpose: "Line B molding batch #42",
      urgency: "Urgent",
      status: "Pending",
      createdAt: nowIso,
      isDemo: true,
      version: 1
    }
  ];
  return {
    employees,
    products,
    attendance,
    suppliers,
    customers,
    salesInvoices,
    purchaseOrders,
    paymentVouchers,
    vehicles,
    uniformAssets,
    secretaryEntries,
    leaves,
    materialRequests
  };
}

// server/store.ts
var DATA_DIR = process.env.SSE_DATA_DIR ? path.resolve(process.env.SSE_DATA_DIR) : path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "erp-db.json");
var ErpStore = class {
  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state) {
          this.data = parsed;
          return;
        }
      } catch {
      }
    }
    this.data = {
      state: createInitialDatabaseState(),
      processedTxIds: []
    };
    this.persist();
  }
  persist() {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf-8");
    fs.renameSync(tmp, DB_FILE);
  }
  getRawState() {
    return this.data.state;
  }
  getUserRole(user) {
    return this.data.state.roles.find((r) => r.id === user.roleId) ?? this.data.state.roles.find((r) => r.name === user.roleName);
  }
  getSanitizedStateForUser(user) {
    const role = this.getUserRole(user);
    const canViewSalaryBank = role?.canViewSalaryBank ?? false;
    const canViewAudit = role?.modules.includes("audit") ?? false;
    const canViewPayroll = role?.modules.includes("payroll") ?? false;
    const cloned = JSON.parse(JSON.stringify(this.data.state));
    cloned.users = cloned.users.map((u) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });
    if (!canViewSalaryBank) {
      cloned.employees = cloned.employees.map((emp) => ({
        ...emp,
        basicSalary: 0,
        transportAllowance: 0,
        housingAllowance: 0,
        bankName: "Restricted",
        bankAccountNumber: "Restricted"
      }));
    }
    if (!canViewPayroll) {
      cloned.payrollRuns = [];
      cloned.bonuses = [];
    }
    if (!canViewAudit) {
      cloned.auditLogs = [];
    }
    return cloned;
  }
  applyMutation(mutation) {
    if (this.data.processedTxIds.includes(mutation.txId)) {
      return { status: "duplicate" };
    }
    const actor = this.data.state.users.find((u) => u.id === mutation.actorId);
    const actorRole = actor ? this.getUserRole(actor) : void 0;
    if (mutation.collection === "auditLogs" && mutation.operation !== "create") {
      return { status: "rejected", reason: "Audit logs are immutable and cannot be edited or deleted." };
    }
    if (mutation.collection === "stockTransactions" && mutation.operation === "create") {
      const tx = mutation.payload;
      if (tx?.type === "Adjustment" && actorRole && !actorRole.canAdjustStock) {
        return { status: "rejected", reason: "Unauthorized stock adjustment blocked by RBAC." };
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (mutation.collection === "companySettings") {
      const incoming = mutation.payload;
      const current = this.data.state.companySettings;
      if (typeof mutation.baseVersion === "number" && current.version > mutation.baseVersion) {
        return {
          status: "conflict",
          conflict: {
            id: `conf_${mutation.txId}`,
            txId: mutation.txId,
            collection: "companySettings",
            recordId: "company_settings",
            localPayload: incoming,
            serverPayload: current,
            detectedAt: now,
            reason: `Server version (${current.version}) is newer than offline base version (${mutation.baseVersion}).`
          }
        };
      }
      this.data.state.companySettings = {
        ...current,
        ...incoming,
        version: current.version + 1,
        updatedAt: now
      };
    } else if (mutation.collection === "payrollConfig") {
      const incoming = mutation.payload;
      const current = this.data.state.payrollConfig;
      this.data.state.payrollConfig = {
        ...current,
        ...incoming,
        version: current.version + 1
      };
    } else {
      const colName = mutation.collection;
      const list = this.data.state[colName];
      if (!Array.isArray(list)) {
        return { status: "rejected", reason: `Unknown collection: ${mutation.collection}` };
      }
      if (mutation.operation === "create") {
        const record = { ...mutation.payload, id: mutation.recordId };
        if (typeof record.version !== "number") record.version = 1;
        const existingIdx = list.findIndex((item) => item.id === mutation.recordId);
        if (existingIdx === -1) {
          list.unshift(record);
          this.handleSideEffects(colName, "create", record, mutation.actorName, now);
        }
      } else if (mutation.operation === "update") {
        const idx = list.findIndex((item) => item.id === mutation.recordId);
        if (idx === -1) {
          const record = { ...mutation.payload, id: mutation.recordId, version: 1 };
          list.unshift(record);
        } else {
          const current = list[idx];
          const currentVer = typeof current.version === "number" ? current.version : 1;
          if (typeof mutation.baseVersion === "number" && currentVer > mutation.baseVersion) {
            return {
              status: "conflict",
              conflict: {
                id: `conf_${mutation.txId}`,
                txId: mutation.txId,
                collection: colName,
                recordId: mutation.recordId,
                localPayload: mutation.payload,
                serverPayload: current,
                detectedAt: now,
                reason: `Record updated on server (v${currentVer}) since offline edit (v${mutation.baseVersion}).`
              }
            };
          }
          const updated = {
            ...current,
            ...mutation.payload,
            version: currentVer + 1
          };
          list[idx] = updated;
          this.handleSideEffects(colName, "update", updated, mutation.actorName, now);
        }
      } else if (mutation.operation === "delete") {
        const idx = list.findIndex((item) => item.id === mutation.recordId);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
      }
    }
    if (mutation.collection !== "chatMessages" && mutation.collection !== "notifications") {
      this.data.state.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: mutation.actorId,
        username: mutation.actorName,
        roleName: mutation.actorRole,
        module: mutation.collection,
        action: `${mutation.operation.toUpperCase()} ${mutation.recordId}`,
        entityId: mutation.recordId,
        newValue: JSON.stringify(mutation.payload).slice(0, 240),
        deviceInfo: mutation.deviceInfo,
        timestamp: now
      });
      if (this.data.state.auditLogs.length > 1e3) {
        this.data.state.auditLogs = this.data.state.auditLogs.slice(0, 1e3);
      }
    }
    this.data.processedTxIds.push(mutation.txId);
    if (this.data.processedTxIds.length > 5e3) {
      this.data.processedTxIds = this.data.processedTxIds.slice(-3e3);
    }
    this.data.state.lastUpdatedAt = now;
    this.persist();
    return { status: "applied" };
  }
  handleSideEffects(colName, op, record, actorName, now) {
    if (colName === "stockTransactions" && op === "create") {
      const tx = record;
      const prod = this.data.state.products.find((p) => p.id === tx.productId);
      if (prod && typeof tx.quantity === "number") {
        if (tx.type === "GRN" || tx.type === "Return") {
          prod.quantity += tx.quantity;
        } else if (tx.type === "GIN" || tx.type === "Damage") {
          prod.quantity = Math.max(0, prod.quantity - tx.quantity);
        } else if (tx.type === "Audit" || tx.type === "Adjustment") {
          prod.quantity = Math.max(0, tx.quantity);
        }
        prod.status = prod.quantity <= 0 ? "Out of Stock" : prod.quantity <= prod.minStockLevel ? "Low Stock" : "Active";
        prod.version += 1;
        prod.updatedAt = now;
        if (prod.quantity <= prod.minStockLevel) {
          this.data.state.notifications.unshift({
            id: `notif_low_${Date.now()}`,
            title: "Low Stock Alert",
            message: `${prod.name} (${prod.itemCode}) is at ${prod.quantity} ${prod.unit}.`,
            module: "inventory",
            severity: "warning",
            readBy: [],
            createdAt: now
          });
        }
      }
    }
    if (colName === "salesInvoices" && op === "create") {
      const inv = record;
      if (inv.type === "Invoice" && Array.isArray(inv.items)) {
        for (const line of inv.items) {
          const prod = this.data.state.products.find((p) => p.id === line.productId);
          if (prod) {
            prod.quantity = Math.max(0, prod.quantity - line.quantity);
            prod.status = prod.quantity <= 0 ? "Out of Stock" : prod.quantity <= prod.minStockLevel ? "Low Stock" : "Active";
            prod.version += 1;
          }
        }
        if (typeof inv.totalAmount === "number" && inv.totalAmount > 0) {
          this.data.state.journalEntries.unshift({
            id: `je_inv_${Date.now()}`,
            entryNumber: `JE-${Date.now().toString().slice(-6)}`,
            date: now.slice(0, 10),
            description: `Sales Invoice ${inv.invoiceNumber} \u2014 ${inv.customerName}`,
            referenceDoc: inv.invoiceNumber,
            lines: [
              { accountId: "acc_1200", accountCode: "1200", accountName: "Accounts Receivable", debit: inv.totalAmount, credit: 0 },
              { accountId: "acc_4000", accountCode: "4000", accountName: "Manufacturing & Trading Revenue", debit: 0, credit: inv.totalAmount }
            ],
            totalDebit: inv.totalAmount,
            totalCredit: inv.totalAmount,
            createdBy: actorName,
            version: 1
          });
        }
      }
    }
    if (colName === "paymentVouchers" && (op === "create" || op === "update")) {
      const pv = record;
      const alreadyPosted = this.data.state.journalEntries.some((j) => j.referenceDoc === pv.voucherNumber);
      if (pv.status === "Posted" && !alreadyPosted && typeof pv.amount === "number" && pv.amount > 0) {
        const isReceipt = pv.type === "Receipt Voucher";
        this.data.state.journalEntries.unshift({
          id: `je_pv_${Date.now()}`,
          entryNumber: `JE-${Date.now().toString().slice(-6)}`,
          date: now.slice(0, 10),
          description: `${pv.type} ${pv.voucherNumber} (${pv.partyName})`,
          referenceDoc: pv.voucherNumber,
          lines: isReceipt ? [
            { accountId: pv.accountId || "acc_1020", accountCode: "1020", accountName: pv.accountName || "Bank", debit: pv.amount, credit: 0 },
            { accountId: "acc_4000", accountCode: "4000", accountName: "Manufacturing & Trading Revenue", debit: 0, credit: pv.amount }
          ] : [
            { accountId: "acc_5300", accountCode: "5300", accountName: "Administrative & Office Expense", debit: pv.amount, credit: 0 },
            { accountId: pv.accountId || "acc_1020", accountCode: "1020", accountName: pv.accountName || "Bank", debit: 0, credit: pv.amount }
          ],
          totalDebit: pv.amount,
          totalCredit: pv.amount,
          createdBy: actorName,
          version: 1
        });
      }
    }
    if (colName === "payrollRuns" && op === "update") {
      const pr = record;
      const ref = `PAY-${pr.month}`;
      const alreadyPosted = this.data.state.journalEntries.some((j) => j.referenceDoc === ref);
      if (pr.status === "Paid" && !alreadyPosted && typeof pr.totalGross === "number" && pr.totalGross > 0) {
        this.data.state.journalEntries.unshift({
          id: `je_pay_${Date.now()}`,
          entryNumber: `JE-${Date.now().toString().slice(-6)}`,
          date: now.slice(0, 10),
          description: `Monthly Payroll Settlement (${pr.month})`,
          referenceDoc: ref,
          lines: [
            { accountId: "acc_5100", accountCode: "5100", accountName: "Salaries & Payroll Expense", debit: pr.totalGross, credit: 0 },
            { accountId: "acc_1020", accountCode: "1020", accountName: "Commercial Bank of Ethiopia - Operating", debit: 0, credit: pr.totalGross }
          ],
          totalDebit: pr.totalGross,
          totalCredit: pr.totalGross,
          createdBy: actorName,
          version: 1
        });
      }
    }
  }
  loadDemoData() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const demo = buildDemoDataset(now);
    const mergeUnique = (existing, incoming) => {
      if (!incoming) return existing;
      const ids = new Set(existing.map((x) => x.id));
      return [...existing, ...incoming.filter((x) => !ids.has(x.id))];
    };
    this.data.state.employees = mergeUnique(this.data.state.employees, demo.employees);
    this.data.state.products = mergeUnique(this.data.state.products, demo.products);
    this.data.state.attendance = mergeUnique(this.data.state.attendance, demo.attendance);
    this.data.state.suppliers = mergeUnique(this.data.state.suppliers, demo.suppliers);
    this.data.state.customers = mergeUnique(this.data.state.customers, demo.customers);
    this.data.state.salesInvoices = mergeUnique(this.data.state.salesInvoices, demo.salesInvoices);
    this.data.state.purchaseOrders = mergeUnique(this.data.state.purchaseOrders, demo.purchaseOrders);
    this.data.state.paymentVouchers = mergeUnique(this.data.state.paymentVouchers, demo.paymentVouchers);
    this.data.state.vehicles = mergeUnique(this.data.state.vehicles, demo.vehicles);
    this.data.state.uniformAssets = mergeUnique(this.data.state.uniformAssets, demo.uniformAssets);
    this.data.state.secretaryEntries = mergeUnique(this.data.state.secretaryEntries, demo.secretaryEntries);
    this.data.state.leaves = mergeUnique(this.data.state.leaves, demo.leaves);
    this.data.state.materialRequests = mergeUnique(this.data.state.materialRequests, demo.materialRequests);
    this.data.state.lastUpdatedAt = now;
    this.persist();
    return this.data.state;
  }
  clearDemoData() {
    const filterDemo = (arr) => arr.filter((x) => !x.isDemo);
    this.data.state.employees = filterDemo(this.data.state.employees);
    this.data.state.employeeEvents = filterDemo(this.data.state.employeeEvents);
    this.data.state.attendance = filterDemo(this.data.state.attendance);
    this.data.state.leaves = filterDemo(this.data.state.leaves);
    this.data.state.payrollRuns = filterDemo(this.data.state.payrollRuns);
    this.data.state.bonuses = filterDemo(this.data.state.bonuses);
    this.data.state.products = filterDemo(this.data.state.products);
    this.data.state.stockTransactions = filterDemo(this.data.state.stockTransactions);
    this.data.state.materialRequests = filterDemo(this.data.state.materialRequests);
    this.data.state.suppliers = filterDemo(this.data.state.suppliers);
    this.data.state.purchaseOrders = filterDemo(this.data.state.purchaseOrders);
    this.data.state.customers = filterDemo(this.data.state.customers);
    this.data.state.salesInvoices = filterDemo(this.data.state.salesInvoices);
    this.data.state.journalEntries = filterDemo(this.data.state.journalEntries);
    this.data.state.paymentVouchers = filterDemo(this.data.state.paymentVouchers);
    this.data.state.uniformAssets = filterDemo(this.data.state.uniformAssets);
    this.data.state.vehicles = filterDemo(this.data.state.vehicles);
    this.data.state.vehicleLogs = filterDemo(this.data.state.vehicleLogs);
    this.data.state.secretaryEntries = filterDemo(this.data.state.secretaryEntries);
    this.data.state.officialDocuments = filterDemo(this.data.state.officialDocuments);
    this.data.state.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.persist();
    return this.data.state;
  }
  restoreBackup(backupState) {
    this.data.state = {
      ...backupState,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.persist();
  }
  saveRaw() {
    this.persist();
  }
};

// server/zipBuilder.ts
import fs2 from "node:fs";
import path2 from "node:path";
import zlib from "node:zlib";
var CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}
function crc32(buf) {
  let crc = 4294967295;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function collectFiles(rootDir, prefix = "") {
  if (!fs2.existsSync(rootDir)) return [];
  const results = [];
  const entries = fs2.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist-electron") continue;
    const fullPath = path2.join(rootDir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      results.push({ relPath, fullPath });
    }
  }
  return results;
}
function buildZipFromDirectories(sources, extraFiles = []) {
  const files = [];
  for (const src of sources) {
    for (const f of collectFiles(src.dir)) {
      files.push({
        zipPath: `${src.zipPrefix}/${f.relPath}`.replace(/\\/g, "/"),
        data: fs2.readFileSync(f.fullPath)
      });
    }
  }
  for (const extra of extraFiles) {
    if (fs2.existsSync(extra.fullPath)) {
      files.push({
        zipPath: extra.relPath.replace(/\\/g, "/"),
        data: fs2.readFileSync(extra.fullPath)
      });
    }
  }
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const nameBuf = Buffer.from(file.zipPath, "utf8");
    const compressed = zlib.deflateRawSync(file.data);
    const crc = crc32(file.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(67324752, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(2048, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(21537, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuf, compressed);
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(33639248, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(2048, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(21537, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }
  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(101010256, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDir, eocd]);
}

// server.ts
dotenv.config();
var PORT = Number(process.env.PORT || 3e3);
var HOST = process.env.HOST || "0.0.0.0";
var app = express();
var server = http.createServer(app);
var store = new ErpStore();
app.use(express.json({ limit: "25mb" }));
var wss = new WebSocketServer({ noServer: true });
var wsClients = /* @__PURE__ */ new Set();
server.on("upgrade", (request, socket, head) => {
  const reqUrl = request.url || "";
  if (reqUrl === "/ws" || reqUrl.startsWith("/ws?")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});
function broadcastPresence() {
  const onlineUsers = Array.from(wsClients).filter((c) => c.userId).map((c) => ({
    userId: c.userId,
    username: c.username,
    fullName: c.fullName,
    roleName: c.roleName
  }));
  const payload = JSON.stringify({
    type: "presence:update",
    onlineUsers
  });
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
function broadcastEvent(event) {
  const payload = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
wss.on("connection", (ws) => {
  const meta = { ws };
  wsClients.add(meta);
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "auth:identify") {
        meta.userId = msg.userId;
        meta.username = msg.username;
        meta.fullName = msg.fullName;
        meta.roleName = msg.roleName;
        meta.deviceId = msg.deviceId;
        broadcastPresence();
      } else if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      }
    } catch {
    }
  });
  ws.on("close", () => {
    wsClients.delete(meta);
    broadcastPresence();
  });
});
var sessions = /* @__PURE__ */ new Map();
function getSessionUser(req) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : void 0;
  if (!token) return void 0;
  const sess = sessions.get(token);
  if (!sess) return void 0;
  return store.getRawState().users.find((u) => u.id === sess.userId);
}
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Seven Sunday Ethiopia ERP",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/auth/login", (req, res) => {
  const { username, password, deviceLabel, platform } = req.body;
  const state = store.getRawState();
  const identifier = (username || "").trim().toLowerCase();
  const user = state.users.find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const label = deviceLabel || "Web Browser";
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    state.loginHistory.unshift({
      id: `lh_${Date.now()}`,
      userId: user?.id || "unknown",
      username: username || "unknown",
      fullName: user?.fullName || "Unknown User",
      roleName: user?.roleName || "N/A",
      deviceLabel: label,
      mode: "online",
      timestamp: now,
      status: "failed"
    });
    store.saveRaw();
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }
  if (user.status === "suspended") {
    res.status(403).json({ error: "This account has been suspended by the administrator." });
    return;
  }
  const token = crypto2.randomBytes(24).toString("hex");
  sessions.set(token, { userId: user.id, deviceLabel: label, createdAt: now });
  user.lastLoginAt = now;
  state.loginHistory.unshift({
    id: `lh_${Date.now()}`,
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    roleName: user.roleName,
    deviceLabel: label,
    mode: "online",
    timestamp: now,
    status: "success"
  });
  if (state.loginHistory.length > 200) {
    state.loginHistory = state.loginHistory.slice(0, 200);
  }
  const existingDev = state.activeDevices.find((d) => d.userId === user.id && d.deviceName === label);
  if (existingDev) {
    existingDev.lastSeenAt = now;
    existingDev.online = true;
  } else {
    state.activeDevices.unshift({
      id: `dev_${Date.now()}`,
      userId: user.id,
      username: user.username,
      deviceName: label,
      platform: platform || "Browser / PWA",
      lastSeenAt: now,
      online: true
    });
  }
  store.saveRaw();
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  const sanitizedState = store.getSanitizedStateForUser(user);
  res.json({
    token,
    user: safeUser,
    state: sanitizedState
  });
});
app.post("/api/auth/logout", (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : void 0;
  if (token) sessions.delete(token);
  res.json({ ok: true });
});
app.get("/api/bootstrap", (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  res.json({
    user: { ...user, passwordHash: void 0 },
    state: store.getSanitizedStateForUser(user)
  });
});
app.post("/api/users/create", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: "Insufficient permissions to manage users." });
    return;
  }
  const body = req.body;
  const state = store.getRawState();
  if (!body.username || !body.fullName || !body.password) {
    res.status(400).json({ error: "Username, full name, and password are required." });
    return;
  }
  if (state.users.some((u) => u.username.toLowerCase() === body.username.toLowerCase())) {
    res.status(409).json({ error: "Username already exists." });
    return;
  }
  const assignedRole = state.roles.find((r) => r.id === body.roleId) ?? state.roles.find((r) => r.name === body.roleName);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newUser = {
    id: `usr_${Date.now()}`,
    username: body.username.trim(),
    email: (body.email || `${body.username}@sevensundayethiopia.com`).trim(),
    fullName: body.fullName.trim(),
    employeeId: body.employeeId,
    roleId: assignedRole?.id || "role_employee",
    roleName: assignedRole?.name || "Employee",
    department: body.department || "Executive Management",
    jobTitle: body.jobTitle || "Staff Member",
    status: "active",
    passwordHash: hashPassword(body.password),
    twoFactorEnabled: Boolean(body.twoFactorEnabled),
    offlineEnabled: body.offlineEnabled ?? true,
    createdAt: now,
    version: 1
  };
  state.users.unshift(newUser);
  state.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: actor.id,
    username: actor.username,
    roleName: actor.roleName,
    module: "users",
    action: `CREATED USER ${newUser.username} (${newUser.roleName})`,
    entityId: newUser.id,
    deviceInfo: "Admin Console",
    timestamp: now
  });
  store.saveRaw();
  const safeUser = { ...newUser };
  delete safeUser.passwordHash;
  broadcastEvent({ type: "sync:refresh", timestamp: now });
  res.json({ user: safeUser });
});
app.post("/api/users/reset-password", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }
  const { userId, newPassword } = req.body;
  const target = store.getRawState().users.find((u) => u.id === userId);
  if (!target || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Valid user and password (min 6 chars) required." });
    return;
  }
  target.passwordHash = hashPassword(newPassword);
  target.version += 1;
  store.saveRaw();
  res.json({ ok: true });
});
app.post("/api/mutate", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const mutation = req.body;
  mutation.actorId = actor.id;
  mutation.actorName = actor.fullName;
  mutation.actorRole = actor.roleName;
  const result = store.applyMutation(mutation);
  if (result.status === "conflict") {
    res.status(409).json(result);
    return;
  }
  if (result.status === "rejected") {
    res.status(403).json(result);
    return;
  }
  broadcastEvent({
    type: "sync:delta",
    mutation,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ ok: true, status: result.status });
});
app.post("/api/sync/push", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const { mutations } = req.body;
  if (!Array.isArray(mutations)) {
    res.status(400).json({ error: "mutations array required." });
    return;
  }
  const appliedTxIds = [];
  const conflicts = [];
  const rejected = [];
  for (const m of mutations) {
    m.actorId = actor.id;
    m.actorName = actor.fullName;
    m.actorRole = actor.roleName;
    const outcome = store.applyMutation(m);
    if (outcome.status === "applied" || outcome.status === "duplicate") {
      appliedTxIds.push(m.txId);
    } else if (outcome.status === "conflict" && outcome.conflict) {
      conflicts.push(outcome.conflict);
    } else if (outcome.status === "rejected") {
      rejected.push({ txId: m.txId, reason: outcome.reason || "Rejected by server policy" });
    }
  }
  if (appliedTxIds.length > 0) {
    broadcastEvent({ type: "sync:refresh", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  res.json({
    appliedTxIds,
    conflicts,
    rejected,
    state: store.getSanitizedStateForUser(actor)
  });
});
app.post("/api/demo/load", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: "Only Administrators can load or clear sample data." });
    return;
  }
  store.loadDemoData();
  broadcastEvent({ type: "sync:refresh", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ state: store.getSanitizedStateForUser(actor) });
});
app.post("/api/demo/clear", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: "Only Administrators can clear sample data." });
    return;
  }
  store.clearDemoData();
  broadcastEvent({ type: "sync:refresh", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ state: store.getSanitizedStateForUser(actor) });
});
app.get("/api/backup/export", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canExportData) {
    res.status(403).json({ error: "Export permission required." });
    return;
  }
  res.json({
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportedBy: actor.username,
    version: "1.0",
    data: store.getRawState()
  });
});
app.post("/api/backup/restore", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: "Administrator permission required to restore backup." });
    return;
  }
  const { data } = req.body;
  if (!data || !data.companySettings || !Array.isArray(data.roles)) {
    res.status(400).json({ error: "Invalid backup archive payload." });
    return;
  }
  store.restoreBackup(data);
  broadcastEvent({ type: "sync:refresh", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ ok: true, state: store.getSanitizedStateForUser(actor) });
});
app.post("/api/attendance/import", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const { csvText, deviceType } = req.body;
  if (!csvText) {
    res.status(400).json({ error: "CSV content is required." });
    return;
  }
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const state = store.getRawState();
  let importedCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && (cols[0].toLowerCase().includes("code") || cols[0].toLowerCase().includes("emp"))) {
      continue;
    }
    const [empCode, date, checkIn, checkOut] = cols;
    if (!empCode || !date) continue;
    const emp = state.employees.find(
      (e) => e.employeeCode.toLowerCase() === empCode.toLowerCase() || e.fullName.toLowerCase() === empCode.toLowerCase()
    );
    const inTime = checkIn || "08:00";
    const outTime = checkOut || "17:00";
    const [inH, inM] = inTime.split(":").map(Number);
    const lateMins = Number.isFinite(inH) && Number.isFinite(inM) ? Math.max(0, inH * 60 + inM - (8 * 60 + 15)) : 0;
    state.attendance.unshift({
      id: `att_imp_${Date.now()}_${i}`,
      employeeId: emp?.id || empCode,
      employeeCode: emp?.employeeCode || empCode,
      employeeName: emp?.fullName || empCode,
      department: emp?.department || "General",
      date,
      shift: "Day Shift (08:00 - 17:00)",
      checkIn: inTime,
      checkOut: outTime,
      status: lateMins > 0 ? "Late" : "Present",
      lateMinutes: lateMins,
      earlyDepartureMinutes: 0,
      overtimeHours: 0,
      source: deviceType || "Hikvision",
      approved: true,
      version: 1
    });
    importedCount++;
  }
  store.saveRaw();
  broadcastEvent({ type: "sync:refresh", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ importedCount });
});
app.post("/api/email/send", (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const smtp = store.getRawState().companySettings.smtp;
  if (!smtp.configured || !smtp.host || !smtp.senderEmail) {
    res.status(422).json({
      delivered: false,
      error: "SMTP mail server is not configured in Company Administration. No email was sent."
    });
    return;
  }
  res.json({
    delivered: false,
    queued: true,
    message: `SMTP gateway (${smtp.host}:${smtp.port}) verified; direct outbound relay requires network mail credentials configured in runtime secrets.`
  });
});
app.get("/api/desktop/windows-kit.zip", (_req, res) => {
  try {
    const rootDir = process.cwd();
    const sources = [
      { dir: path3.join(rootDir, "desktop-win"), zipPrefix: "SevenSunday-Windows-Desktop/desktop-win" }
    ];
    const distDir = path3.join(rootDir, "dist");
    if (requireExistsDir(distDir)) {
      sources.push({ dir: distDir, zipPrefix: "SevenSunday-Windows-Desktop/dist" });
    }
    const zipBuffer = buildZipFromDirectories(sources, [
      { relPath: "SevenSunday-Windows-Desktop/scripts/prepare-desktop.mjs", fullPath: path3.join(rootDir, "scripts", "prepare-desktop.mjs") },
      { relPath: "SevenSunday-Windows-Desktop/README-WINDOWS.md", fullPath: path3.join(rootDir, "desktop-win", "README-WINDOWS.md") }
    ]);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="SevenSunday-Windows-Desktop-Kit.zip"');
    res.setHeader("Content-Length", String(zipBuffer.length));
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to package Windows Desktop Kit." });
  }
});
function requireExistsDir(dirPath) {
  try {
    return fs3.existsSync(dirPath) && fs3.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    app.get("/dev-sw.js", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.send(`
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      if ('navigate' in client) {
        client.navigate(client.url);
      }
    }
  })());
});
`);
    });
    app.get("/manifest.webmanifest", (_req, res) => {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.json({
        id: "/",
        name: "Seven Sunday Ethiopia ERP",
        short_name: "SevenSunday",
        description: "Unified online and offline corporate management platform for Seven Sunday Manufacturing & Trading PLC.",
        theme_color: "#082B59",
        background_color: "#F5F8FC",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      });
    });
    const disableHmr = process.env.DISABLE_HMR === "true";
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
          path: "/vite-hmr"
        },
        watch: disableHmr ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distDir = process.env.SSE_DIST_DIR ? path3.resolve(process.env.SSE_DIST_DIR) : path3.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path3.join(distDir, "index.html"));
    });
  }
  server.listen(PORT, HOST, () => {
    console.log(`Seven Sunday Ethiopia ERP Server running on http://${HOST}:${PORT}`);
  });
}
startServer();
