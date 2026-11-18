export type LanguageCode = 'en' | 'am' | 'om' | 'zh';
export type CalendarSystem = 'ethiopian' | 'gregorian' | 'dual';

export type ModuleKey =
  | 'dashboard'
  | 'admin'
  | 'hr'
  | 'secretary'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'inventory'
  | 'materials'
  | 'purchasing'
  | 'sales'
  | 'finance'
  | 'assets'
  | 'fleet'
  | 'documents'
  | 'chat'
  | 'approvals'
  | 'audit'
  | 'sync'
  | 'reports';

export type DefaultRoleName =
  | 'Super Administrator'
  | 'Company Owner'
  | 'General Manager'
  | 'Department Manager'
  | 'Human Resource Manager'
  | 'Finance Manager'
  | 'Accountant'
  | 'Inventory Manager'
  | 'Warehouse Manager'
  | 'Procurement Officer'
  | 'Sales Manager'
  | 'Security Supervisor'
  | 'Secretary'
  | 'Employee'
  | 'Auditor'
  | 'Viewer';

export interface RoleDefinition {
  id: string;
  name: string;
  isSystem: boolean;
  modules: ModuleKey[];
  canApprove: boolean;
  canViewSalaryBank: boolean;
  canAdjustStock: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canAccessOfflinePayroll: boolean;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  budgetEtb: number;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  senderEmail: string;
  senderName: string;
  username: string;
  configured: boolean;
}

export interface CompanySettings {
  id: 'company_settings';
  companyName: string;
  brandName: string;
  slogan: string;
  secondarySlogan: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  website: string;
  tinNumber: string;
  registrationNumber: string;
  vatNumber: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  vatRatePercent: number;
  defaultLanguage: LanguageCode;
  calendarSystem: CalendarSystem;
  primaryColor: string;
  secondaryColor: string;
  customLogoDataUrl: string;
  companyStampDataUrl: string;
  authorizedSignatureDataUrl: string;
  letterheadFooter: string;
  retentionDays: number;
  twoFactorRequiredForAdmins: boolean;
  smtp: SmtpConfig;
  version: number;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  employeeId?: string;
  roleId: string;
  roleName: string;
  department: string;
  jobTitle: string;
  status: 'active' | 'suspended';
  passwordHash?: string;
  twoFactorEnabled: boolean;
  offlineEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  version: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
  deviceLabel: string;
  mode: 'online' | 'offline';
  timestamp: string;
  status: 'success' | 'failed';
}

export interface ActiveDevice {
  id: string;
  userId: string;
  username: string;
  deviceName: string;
  platform: string;
  lastSeenAt: string;
  online: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  department: string;
  jobTitle: string;
  employmentType: 'Permanent' | 'Contract' | 'Probation' | 'Daily Labor';
  startDate: string;
  contractExpiryDate?: string;
  basicSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  bankName?: string;
  bankAccountNumber?: string;
  tinNumber?: string;
  education: string;
  workExperience: string;
  idDocumentNumber: string;
  photoDataUrl?: string;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Terminated' | 'Resigned';
  isDemo?: boolean;
  version: number;
  updatedAt: string;
}

export interface EmployeeEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Promotion' | 'Transfer' | 'Disciplinary' | 'Evaluation' | 'Contract Renewal' | 'Termination' | 'Resignation';
  effectiveDate: string;
  title: string;
  details: string;
  recordedBy: string;
  isDemo?: boolean;
  version: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  date: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day';
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeHours: number;
  source: 'Manual' | 'Hikvision' | 'ZKTeco' | 'CSV Import' | 'Offline Register';
  approved: boolean;
  notes?: string;
  isDemo?: boolean;
  version: number;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  createdAt: string;
  version: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: 'Annual' | 'Sick' | 'Emergency' | 'Maternity' | 'Unpaid' | 'Other';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  createdAt: string;
  isDemo?: boolean;
  version: number;
}

export interface TaxBracket {
  min: number;
  max: number | null;
  ratePercent: number;
  deduction: number;
}

export interface PayrollConfig {
  id: 'payroll_config';
  effectiveDate: string;
  employeePensionPercent: number;
  employerPensionPercent: number;
  overtimeWeekdayMultiplier: number;
  overtimeWeekendMultiplier: number;
  overtimeHolidayMultiplier: number;
  workingHoursPerMonth: number;
  brackets: TaxBracket[];
  version: number;
}

export interface PayslipItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  bonus: number;
  grossPay: number;
  incomeTax: number;
  employeePension: number;
  employerPension: number;
  loanDeduction: number;
  otherDeductions: number;
  netPay: number;
  bankName?: string;
  bankAccountNumber?: string;
}

export interface PayrollRun {
  id: string;
  month: string; // YYYY-MM
  status: 'Draft' | 'HR Verified' | 'Finance Reviewed' | 'Approved' | 'Paid';
  totalGross: number;
  totalTax: number;
  totalPension: number;
  totalNet: number;
  items: PayslipItem[];
  hrVerifiedBy?: string;
  financeReviewedBy?: string;
  approvedBy?: string;
  paidAt?: string;
  createdAt: string;
  isDemo?: boolean;
  version: number;
}

export interface BonusRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  type: 'Performance' | 'Production' | 'Annual' | 'Incentive' | 'Other';
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Paid';
  isDemo?: boolean;
  version: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  capacityNote: string;
}

export interface Product {
  id: string;
  itemCode: string;
  barcode: string;
  name: string;
  category: 'Finished Product' | 'Raw Material' | 'Construction Material' | 'Office Supply' | 'Production Material' | 'Spare Part';
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  warehouseId: string;
  warehouseName: string;
  supplierId?: string;
  supplierName?: string;
  expiryDate?: string;
  status: 'Active' | 'Low Stock' | 'Out of Stock' | 'Damaged' | 'Expired';
  isDemo?: boolean;
  version: number;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  docNumber: string;
  type: 'GRN' | 'GIN' | 'Transfer' | 'Adjustment' | 'Return' | 'Damage' | 'Audit';
  productId: string;
  itemCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  warehouseId: string;
  warehouseName: string;
  targetWarehouseName?: string;
  department?: string;
  destination?: string;
  supplierName?: string;
  senderName?: string;
  receivedPerson?: string;
  driverName?: string;
  vehiclePlate?: string;
  condition: 'Good' | 'Partial Damage' | 'Damaged' | 'Expired';
  approvedBy?: string;
  issuedBy?: string;
  signatureText?: string;
  notes?: string;
  date: string;
  status: 'Completed' | 'Pending Approval';
  isDemo?: boolean;
  version: number;
}

export interface MaterialRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  department: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  purpose: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  status: 'Pending' | 'Approved' | 'Issued' | 'Rejected';
  approvedBy?: string;
  createdAt: string;
  isDemo?: boolean;
  version: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tinNumber: string;
  category: string;
  balancePayable: number;
  rating: number;
  isDemo?: boolean;
  version: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: { productId: string; itemCode: string; name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  expectedDate: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Received' | 'Paid' | 'Cancelled';
  approvedBy?: string;
  quotationRef?: string;
  createdAt: string;
  isDemo?: boolean;
  version: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tinNumber: string;
  creditLimit: number;
  balanceReceivable: number;
  isDemo?: boolean;
  version: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  type: 'Quotation' | 'Sales Order' | 'Invoice' | 'Delivery Note' | 'Return';
  customerId: string;
  customerName: string;
  items: { productId: string; itemCode: string; name: string; quantity: number; unitPrice: number; total: number }[];
  discount: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Draft' | 'Confirmed' | 'Delivered' | 'Partial' | 'Paid' | 'Returned';
  date: string;
  dueDate: string;
  isDemo?: boolean;
  version: number;
}

export interface FinanceAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  currency: string;
  balance: number;
  isBankOrCash: boolean;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceDoc?: string;
  lines: { accountId: string; accountCode: string; accountName: string; debit: number; credit: number }[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  isDemo?: boolean;
  version: number;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  type: 'Payment Voucher' | 'Receipt Voucher' | 'Petty Cash';
  partyName: string;
  accountId: string;
  accountName: string;
  category: string;
  amount: number;
  currency: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Telebirr / Mobile';
  referenceNo: string;
  description: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Posted';
  approvedBy?: string;
  isDemo?: boolean;
  version: number;
}

export interface BudgetItem {
  id: string;
  department: string;
  fiscalYear: string;
  allocatedAmount: number;
  spentAmount: number;
  notes: string;
}

export interface UniformAssetIssue {
  id: string;
  itemCode: string;
  itemName: string;
  category: 'Office Uniform' | 'Security Uniform' | 'Cleaner Uniform' | 'Labor Uniform' | 'Safety Helmet' | 'Safety Boots' | 'Reflective Jacket' | 'Gloves' | 'PPE' | 'Staff ID Card' | 'Company Bag' | 'Laptop' | 'Phone' | 'Office Equipment';
  employeeId: string;
  employeeName: string;
  department: string;
  quantity: number;
  condition: 'New' | 'Good' | 'Fair' | 'Damaged' | 'Lost';
  dateIssued: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'Issued' | 'Returned' | 'Damaged' | 'Lost';
  approvalStatus: 'Pending' | 'Approved';
  signatureText?: string;
  isDemo?: boolean;
  version: number;
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  model: string;
  type: 'Truck' | 'Pickup' | 'Van' | 'Sedan' | 'Forklift' | 'Generator / Equipment';
  assignedDriver: string;
  department: string;
  mileageKm: number;
  insuranceExpiry: string;
  inspectionDate: string;
  nextServiceDate: string;
  status: 'Operational' | 'In Maintenance' | 'Grounded';
  isDemo?: boolean;
  version: number;
}

export interface VehicleLog {
  id: string;
  vehicleId: string;
  plateNumber: string;
  logType: 'Fuel' | 'Maintenance' | 'Repair' | 'Trip';
  date: string;
  liters?: number;
  costEtb: number;
  odometerKm: number;
  vendorOrWorkshop: string;
  description: string;
  approvedBy?: string;
  isDemo?: boolean;
  version: number;
}

export interface SecretaryEntry {
  id: string;
  refNumber: string;
  direction: 'Incoming' | 'Outgoing' | 'Internal Memo' | 'Meeting Minutes';
  subject: string;
  counterparty: string;
  department: string;
  assignedTo: string;
  priority: 'Normal' | 'Urgent' | 'Confidential';
  status: 'Received' | 'In Review' | 'Responded' | 'Archived';
  date: string;
  summary: string;
  isDemo?: boolean;
  version: number;
}

export type OfficialDocTemplateType =
  | 'Sales Invoice'
  | 'Payment Receipt'
  | 'Purchase Order'
  | 'Delivery Note'
  | 'Company Report'
  | 'Payment Voucher'
  | 'Receipt Voucher'
  | 'Employee Letter'
  | 'Employment Contract'
  | 'Salary Certificate'
  | 'Warning Letter'
  | 'Material Issue Voucher'
  | 'Goods Receiving Note'
  | 'Stock Transfer Form'
  | 'Maintenance Form'
  | 'Time Tracking Attendance Form'
  | 'Audit Report'
  | 'Quotation Document'
  | 'Customer Statement'
  | 'Supplier Statement';

export interface OfficialDocument {
  id: string;
  docNumber: string;
  templateType: OfficialDocTemplateType;
  title: string;
  recipientName: string;
  department: string;
  language: LanguageCode;
  bilingualPair?: LanguageCode;
  subject: string;
  bodyText: string;
  translatedBodyText?: string;
  amount?: number;
  currency?: string;
  issuedBy: string;
  approvedBy?: string;
  date: string;
  status: 'Draft' | 'Issued' | 'Archived';
  isDemo?: boolean;
  version: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'announcement' | 'department' | 'group' | 'direct';
  participants: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  attachmentName?: string;
  attachmentType?: string;
  readBy: string[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  module: ModuleKey;
  severity: 'info' | 'warning' | 'success' | 'critical';
  readBy: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  roleName: string;
  module: string;
  action: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  deviceInfo: string;
  timestamp: string;
}

export type CollectionName =
  | 'roles'
  | 'branches'
  | 'departments'
  | 'users'
  | 'loginHistory'
  | 'activeDevices'
  | 'employees'
  | 'employeeEvents'
  | 'attendance'
  | 'attendanceCorrections'
  | 'leaves'
  | 'payrollRuns'
  | 'bonuses'
  | 'warehouses'
  | 'products'
  | 'stockTransactions'
  | 'materialRequests'
  | 'suppliers'
  | 'purchaseOrders'
  | 'customers'
  | 'salesInvoices'
  | 'financeAccounts'
  | 'journalEntries'
  | 'paymentVouchers'
  | 'budgets'
  | 'uniformAssets'
  | 'vehicles'
  | 'vehicleLogs'
  | 'secretaryEntries'
  | 'officialDocuments'
  | 'chatChannels'
  | 'chatMessages'
  | 'notifications'
  | 'auditLogs';

export interface ErpDatabaseState {
  companySettings: CompanySettings;
  payrollConfig: PayrollConfig;
  roles: RoleDefinition[];
  branches: Branch[];
  departments: Department[];
  users: UserAccount[];
  loginHistory: LoginHistoryEntry[];
  activeDevices: ActiveDevice[];
  employees: Employee[];
  employeeEvents: EmployeeEvent[];
  attendance: AttendanceRecord[];
  attendanceCorrections: AttendanceCorrection[];
  leaves: LeaveRequest[];
  payrollRuns: PayrollRun[];
  bonuses: BonusRecord[];
  warehouses: Warehouse[];
  products: Product[];
  stockTransactions: StockTransaction[];
  materialRequests: MaterialRequest[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  salesInvoices: SalesInvoice[];
  financeAccounts: FinanceAccount[];
  journalEntries: JournalEntry[];
  paymentVouchers: PaymentVoucher[];
  budgets: BudgetItem[];
  uniformAssets: UniformAssetIssue[];
  vehicles: VehicleRecord[];
  vehicleLogs: VehicleLog[];
  secretaryEntries: SecretaryEntry[];
  officialDocuments: OfficialDocument[];
  chatChannels: ChatChannel[];
  chatMessages: ChatMessage[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  lastUpdatedAt: string;
}

export interface SyncMutation {
  txId: string;
  collection: CollectionName | 'companySettings' | 'payrollConfig';
  operation: 'create' | 'update' | 'delete';
  recordId: string;
  payload: unknown;
  baseVersion?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
  deviceInfo: string;
  createdAt: string;
  retries: number;
  lastError?: string;
}

export interface SyncConflict {
  id: string;
  txId: string;
  collection: string;
  recordId: string;
  localPayload: unknown;
  serverPayload: unknown;
  detectedAt: string;
  reason: string;
}
