import type { Employee, PayrollConfig, PayslipItem, TaxBracket } from '../types/erp';

export const DEFAULT_ETHIOPIAN_BRACKETS: TaxBracket[] = [
  { min: 0, max: 600, ratePercent: 0, deduction: 0 },
  { min: 601, max: 1650, ratePercent: 10, deduction: 60 },
  { min: 1651, max: 3200, ratePercent: 15, deduction: 142.5 },
  { min: 3201, max: 5250, ratePercent: 20, deduction: 302.5 },
  { min: 5251, max: 7800, ratePercent: 25, deduction: 565 },
  { min: 7801, max: 10900, ratePercent: 30, deduction: 955 },
  { min: 10901, max: null, ratePercent: 35, deduction: 1500 },
];

export function calculateIncomeTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  const sorted = [...brackets].sort((a, b) => a.min - b.min);
  for (const b of sorted) {
    if (b.max === null || taxableIncome <= b.max) {
      return Math.max(0, Number(((taxableIncome * b.ratePercent) / 100 - b.deduction).toFixed(2)));
    }
  }
  const last = sorted[sorted.length - 1];
  if (!last) return 0;
  return Math.max(0, Number(((taxableIncome * last.ratePercent) / 100 - last.deduction).toFixed(2)));
}

export function calculateEmployeePayslip(
  employee: Employee,
  config: PayrollConfig,
  options: {
    overtimeHours?: number;
    bonus?: number;
    loanDeduction?: number;
    otherDeductions?: number;
  } = {}
): PayslipItem {
  const overtimeHours = options.overtimeHours ?? 0;
  const bonus = options.bonus ?? 0;
  const loanDeduction = options.loanDeduction ?? 0;
  const otherDeductions = options.otherDeductions ?? 0;

  const hourlyRate = employee.basicSalary / Math.max(1, config.workingHoursPerMonth);
  const overtimePay = Number(
    (overtimeHours * hourlyRate * config.overtimeWeekdayMultiplier).toFixed(2)
  );
  const allowances = Number(
    ((employee.transportAllowance || 0) + (employee.housingAllowance || 0)).toFixed(2)
  );

  const grossPay = Number(
    (employee.basicSalary + allowances + overtimePay + bonus).toFixed(2)
  );

  // Taxable gross (note: up to 600 ETB transport allowance is generally tax-exempt in Ethiopia, keeping configurable simplicity)
  const taxableIncome = Math.max(
    0,
    employee.basicSalary +
      Math.max(0, (employee.transportAllowance || 0) - 600) +
      (employee.housingAllowance || 0) +
      overtimePay +
      bonus
  );

  const incomeTax = calculateIncomeTax(taxableIncome, config.brackets);
  const employeePension =
    employee.employmentType === 'Daily Labor'
      ? 0
      : Number(((employee.basicSalary * config.employeePensionPercent) / 100).toFixed(2));
  const employerPension =
    employee.employmentType === 'Daily Labor'
      ? 0
      : Number(((employee.basicSalary * config.employerPensionPercent) / 100).toFixed(2));

  const netPay = Math.max(
    0,
    Number(
      (grossPay - incomeTax - employeePension - loanDeduction - otherDeductions).toFixed(2)
    )
  );

  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    basicSalary: employee.basicSalary,
    allowances,
    overtimePay,
    bonus,
    grossPay,
    incomeTax,
    employeePension,
    employerPension,
    loanDeduction,
    otherDeductions,
    netPay,
    bankName: employee.bankName,
    bankAccountNumber: employee.bankAccountNumber,
  };
}
