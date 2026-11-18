import type { CalendarSystem } from '../types/erp';

const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
];

const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
];

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export interface EthiopianDateParts {
  year: number;
  month: number; // 1-13
  day: number; // 1-30
  monthNameEn: string;
  monthNameAm: string;
}

export function toEthiopianDate(input: Date | string): EthiopianDateParts {
  const d = typeof input === 'string' ? new Date(input) : input;
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const jdn = gregorianToJdn(
    safeDate.getUTCFullYear(),
    safeDate.getUTCMonth() + 1,
    safeDate.getUTCDate()
  );

  // Ethiopic epoch JDN = 1724221 (1 Meskerem 1 E.C.)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  const idx = Math.max(0, Math.min(12, month - 1));
  return {
    year,
    month,
    day,
    monthNameEn: ETHIOPIAN_MONTHS_EN[idx],
    monthNameAm: ETHIOPIAN_MONTHS_AM[idx],
  };
}

export function formatCorporateDate(
  input: Date | string | undefined,
  system: CalendarSystem = 'dual',
  lang: 'en' | 'am' | 'om' | 'zh' = 'en'
): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);

  const greg = d.toISOString().slice(0, 10);
  const eth = toEthiopianDate(d);
  const ethLabel =
    lang === 'am'
      ? `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም`
      : `${eth.monthNameEn} ${eth.day}, ${eth.year} E.C.`;

  if (system === 'gregorian') return greg;
  if (system === 'ethiopian') return ethLabel;
  return `${greg} (${ethLabel})`;
}
