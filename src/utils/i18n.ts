import type { LanguageCode, OfficialDocTemplateType } from '../types/erp';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  am: 'አማርኛ (Amharic)',
  om: 'Afaan Oromoo',
  zh: '中文 (Chinese)',
};

const UI_TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    dashboard: 'Executive Dashboard',
    admin: 'Company Administration',
    hr: 'Human Resources',
    secretary: 'Secretary Department',
    attendance: 'Attendance & Time',
    leave: 'Leave Management',
    payroll: 'Payroll & Bonuses',
    inventory: 'Inventory & Warehouses',
    materials: 'Materials & Logistics',
    purchasing: 'Procurement & Purchasing',
    sales: 'Sales & Customers',
    finance: 'Finance & Accounting',
    assets: 'Uniforms & Assets',
    fleet: 'Vehicles & Equipment',
    documents: 'Official Documents',
    chat: 'Internal Chat',
    approvals: 'Approvals Queue',
    audit: 'Audit Management',
    sync: 'Sync & Backup',
    reports: 'Reports & Exports',
    online: 'Online',
    offline: 'Offline Mode',
    syncNow: 'Sync Now',
    searchPlaceholder: 'Search employees, invoices, items, documents...',
    logout: 'Sign Out',
  },
  am: {
    dashboard: 'ዋና ዳሽቦርድ',
    admin: 'የኩባንያ አስተዳደር',
    hr: 'የሰው ኃይል አስተዳደር',
    secretary: 'የጸሐፊ ክፍል',
    attendance: 'የሰዓት መቆጣጠሪያ',
    leave: 'የፈቃድ አስተዳደር',
    payroll: 'የደመወዝ ክፍያ እና ቦነስ',
    inventory: 'ንብረት እና መጋዘን',
    materials: 'ቁሳቁስ እና ሎጂስቲክስ',
    purchasing: 'ግዥ እና አቅራቢዎች',
    sales: 'ሽያጭ እና ደንበኞች',
    finance: 'ፋይናንስ እና ሒሳብ',
    assets: 'ዩኒፎርም እና ንብረት',
    fleet: 'ተሽከርካሪዎች እና መሳሪያዎች',
    documents: 'ኦፊሴላዊ ሰነዶች',
    chat: 'ውስጣዊ መልእክት',
    approvals: 'የማጽደቂያ ወረፋ',
    audit: 'ኦዲት አስተዳደር',
    sync: 'ማመሳሰል እና ምትኬ',
    reports: 'ሪፖርቶች እና መውጫ',
    online: 'መስመር ላይ',
    offline: 'ከመስመር ውጭ',
    syncNow: 'አሁን አመሳስል',
    searchPlaceholder: 'ሰራተኞችን፣ ደረሰኞችን፣ እቃዎችን ይፈልጉ...',
    logout: 'ውጣ',
  },
  om: {
    dashboard: 'Daashboordii Olaanaa',
    admin: 'Bulchiinsa Dhaabbataa',
    hr: 'Humna Namaa',
    secretary: 'Kutaa Barreessaa',
    attendance: 'Hordoffii Sa’aatii',
    leave: 'Bulchiinsa Hayyamaa',
    payroll: 'Mindaa fi Boonasii',
    inventory: 'Kuusaa fi Meeshaalee',
    materials: 'Meeshaalee fi Lojistikii',
    purchasing: 'Bittaa fi Dhiyeessitoota',
    sales: 'Gurgurtaa fi Maamiltoota',
    finance: 'Faayinaansii fi Herrega',
    assets: 'Uffata Seeraa fi Qabeenya',
    fleet: 'Konkolaataa fi Meeshaalee',
    documents: 'Sanadoota Seeraa',
    chat: 'Ergaa Keessaa',
    approvals: 'Mirkaneessa Eegaa Jiran',
    audit: 'Bulchiinsa Odiitii',
    sync: 'Walsimsiisuu fi Kuusaa',
    reports: 'Gabaasawwan',
    online: 'Toora Irra',
    offline: 'Toora Alaa',
    syncNow: 'Amma Walsimsiisi',
    searchPlaceholder: 'Hojjattoota, nagahee, meeshaalee barbaadi...',
    logout: 'Bahi',
  },
  zh: {
    dashboard: '管理仪表板',
    admin: '公司管理中心',
    hr: '人力资源',
    secretary: '秘书部门',
    attendance: '考勤与工时',
    leave: '请假管理',
    payroll: '薪资与奖金',
    inventory: '库存与仓库',
    materials: '物资与物流',
    purchasing: '采购管理',
    sales: '销售与客户',
    finance: '财务与会计',
    assets: '制服与资产',
    fleet: '车辆与设备',
    documents: '官方文件',
    chat: '内部通讯',
    approvals: '审批队列',
    audit: '审计管理',
    sync: '同步与备份',
    reports: '报表导出',
    online: '在线',
    offline: '离线模式',
    syncNow: '立即同步',
    searchPlaceholder: '搜索员工、发票、物资、文件...',
    logout: '退出登录',
  },
};

export function tUi(lang: LanguageCode, key: string): string {
  return UI_TRANSLATIONS[lang]?.[key] ?? UI_TRANSLATIONS.en[key] ?? key;
}

const TEMPLATE_TITLES: Record<OfficialDocTemplateType, Record<LanguageCode, string>> = {
  'Sales Invoice': { en: 'OFFICIAL SALES INVOICE', am: 'ኦፊሴላዊ የሽያጭ ደረሰኝ', om: 'NAGAHEE GURGURTAA SEERAA', zh: '官方销售发票' },
  'Payment Receipt': { en: 'OFFICIAL PAYMENT RECEIPT', am: 'የክፍያ ደረሰኝ', om: 'NAGAHEE Kaffaltii', zh: '官方付款收据' },
  'Purchase Order': { en: 'PURCHASE ORDER (PO)', am: 'የግዥ ትዕዛዝ', om: 'AJAJA BITTAA', zh: '采购订单' },
  'Delivery Note': { en: 'GOODS DELIVERY NOTE', am: 'የእቃ ማስረከቢያ ሰነድ', om: 'Waraqaa Geejjibaa', zh: '送货单' },
  'Company Report': { en: 'EXECUTIVE COMPANY REPORT', am: 'የኩባንያ ኦፊሴላዊ ሪፖርት', om: 'Gabaasa Dhaabbataa', zh: '公司官方报告' },
  'Payment Voucher': { en: 'PAYMENT VOUCHER', am: 'የክፍያ ማዘዣ (ቫውቸር)', om: 'Waraqaa Kaffaltii', zh: '付款凭证' },
  'Receipt Voucher': { en: 'RECEIPT VOUCHER', am: 'የገቢ ማረጋገጫ ቫውቸር', om: 'Waraqaa Galii', zh: '收款凭证' },
  'Employee Letter': { en: 'OFFICIAL EMPLOYEE LETTER', am: 'ኦፊሴላዊ የሰራተኛ ደብዳቤ', om: 'Xalayaa Hojjetaa Seeraa', zh: '员工官方信函' },
  'Employment Contract': { en: 'EMPLOYMENT CONTRACT AGREEMENT', am: 'የስራ ቅጥር ውል ስምምነት', om: 'Waliigaltee Qacarrii Hojii', zh: '劳动雇佣合同' },
  'Salary Certificate': { en: 'SALARY & EMPLOYMENT CERTIFICATE', am: 'የደመወዝ እና የስራ ማረጋገጫ', om: 'Ragaa Mindaa fi Hojii', zh: '薪资与在职证明' },
  'Warning Letter': { en: 'OFFICIAL WARNING LETTER', am: 'የጽሑፍ ማስጠንቀቂያ ደብዳቤ', om: 'Xalayaa Akeekkachiisaa', zh: '正式警告信' },
  'Material Issue Voucher': { en: 'MATERIAL ISSUE VOUCHER (GIN)', am: 'የንብረት/ቁሳቁስ ወጪ ሰነድ', om: 'Waraqaa Baasii Meeshaa', zh: '物资领料单' },
  'Goods Receiving Note': { en: 'GOODS RECEIVING NOTE (GRN)', am: 'የእቃ ገቢ ማረጋገጫ ሰነድ', om: 'Waraqaa Galmeessa Meeshaa', zh: '货物接收单 (GRN)' },
  'Stock Transfer Form': { en: 'INTER-WAREHOUSE STOCK TRANSFER FORM', am: 'የመጋዘን ንብረት ዝውውር ቅጽ', om: 'Unka Jijjiirraa Kuusaa', zh: '仓库调拨单' },
  'Maintenance Form': { en: 'VEHICLE & EQUIPMENT MAINTENANCE FORM', am: 'የተሽከርካሪና መሳሪያ ጥገና ቅጽ', om: 'Unka Suphaa Konkolaataa', zh: '车辆设备维修单' },
  'Time Tracking Attendance Form': { en: 'TIME TRACKING ATTENDANCE FORM', am: 'የሰዓት እና የመገኘት መመዝገቢያ ቅጽ', om: 'Unka Hordoffii Sa’aatii', zh: '考勤工时记录表' },
  'Audit Report': { en: 'INTERNAL AUDIT & RECONCILIATION REPORT', am: 'የውስጥ ኦዲት እና ማስታረቂያ ሪፖርት', om: 'Gabaasa Odiitii Keessaa', zh: '内部审计报告' },
  'Quotation Document': { en: 'OFFICIAL PRICE QUOTATION', am: 'ኦፊሴላዊ የዋጋ ግምት ሰነድ', om: 'Tilmaama Gatii Seeraa', zh: '官方报价单' },
  'Customer Statement': { en: 'CUSTOMER ACCOUNT STATEMENT', am: 'የደንበኛ የሒሳብ መግለጫ', om: 'Ibsa Herrega Maamilaa', zh: '客户对账单' },
  'Supplier Statement': { en: 'SUPPLIER ACCOUNT STATEMENT', am: 'የአቅራቢ የሒሳብ መግለጫ', om: 'Ibsa Herrega Dhiyeessaa', zh: '供应商对账单' },
};

const SALUTATIONS: Record<LanguageCode, string> = {
  en: 'Dear',
  am: 'ለተከበሩ',
  om: 'Kabajamoo',
  zh: '尊敬的',
};

const CLOSINGS: Record<LanguageCode, string> = {
  en: 'Sincerely,\nSeven Sunday Manufacturing & Trading PLC Management',
  am: 'ከሰላምታ ጋር፣\nየሰቨን ሰንዴይ ማኑፋክቸሪንግ እና ትሬዲንግ ኃ.የተ.የግ.ማ አስተዳደር',
  om: 'Nagaa Wajjin,\nBulchiinsa Seven Sunday Manufacturing & Trading PLC',
  zh: '此致敬礼，\nSeven Sunday 制造贸易有限公司管理层',
};

const PHRASE_DICTIONARY: Array<Record<LanguageCode, string>> = [
  {
    en: 'This official corporate document is issued by Seven Sunday Manufacturing & Trading PLC in accordance with company policy and Ethiopian commercial regulations.',
    am: 'ይህ ኦፊሴላዊ የኩባንያ ሰነድ በሰቨን ሰንዴይ ማኑፋክቸሪንግ እና ትሬዲንግ ኃ.የተ.የግ.ማ የውስጥ መመሪያ እና በኢትዮጵያ የንግድ ሕግ መሠረት የተሰጠ ነው።',
    om: 'Sanadni dhaabbataa kun qajeelfama keessaa Seven Sunday Manufacturing & Trading PLC fi seera daldalaa Itoophiyaa irratti hundaa’uun kan kennameedha.',
    zh: '本官方企业文件由 Seven Sunday 制造贸易有限公司依据公司政策及埃塞俄比亚商业法规签发。',
  },
  {
    en: 'We hereby confirm the employment and monthly gross salary details of the staff member listed above.',
    am: 'ከላይ የተጠቀሱት የኩባንያችን ባልደረባ የስራ ሁኔታ እና ወርሃዊ ደመወዝ ትክክለኛ መሆኑን በዚህ ማረጋገጫ እናረጋግጣለን።',
    om: 'Hojjetaan maqaan isaanii armaan olitti ibsame dhaabbata keenya keessatti hojjechaa jiraachuu fi mindaan isaanii ji’aa sirrii ta’uu ni mirkaneessina.',
    zh: '特此证明上述员工在本公司的在职状态及其月度税前薪资信息属实。',
  },
  {
    en: 'Please ensure all materials, quantities, and vehicle details are verified and signed before dispatch or acceptance.',
    am: 'እባክዎ እቃዎች ከመውጣታቸው ወይም ከመግባታቸው በፊት ብዛታቸው፣ ሁኔታቸው እና የተሽከርካሪ መረጃ መረጋገጡን እና መፈረሙን ያረጋግጡ።',
    om: 'Meeshaaleen osoo hin ergamin ykn hin fudhatamin dura lakkoofsi, haalli meeshaa fi odeeffannoon konkolaataa mirkanaa’ee mallatteeffamuu isaa mirkaneessaa.',
    zh: '请在物资出库或入库前核实所有品名、数量及车辆信息并签字确认。',
  },
  {
    en: 'This notice serves as a formal administrative communication requiring prompt attention and written acknowledgement.',
    am: 'ይህ ደብዳቤ ፈጣን ትኩረት እና የጽሑፍ ማረጋገጫ የሚያስፈልገው ኦፊሴላዊ የአስተዳደር ማሳሰቢያ ነው።',
    om: 'Beeksisni kun xiyyeeffannoo hatattamaa fi deebii barreeffamaa kan barbaadu xalayaa bulchiinsaa seera qabeessa dha.',
    zh: '本通知为正式行政公函，请予以高度重视并书面确认。',
  },
  {
    en: 'All financial figures are denominated in Ethiopian Birr (ETB) unless explicitly stated otherwise.',
    am: 'ሌላ ምንዛሪ ካልተገለጸ በስተቀር ሁሉም የገንዘብ መጠኖች በኢትዮጵያ ብር (ETB) የተመዘገቡ ናቸው።',
    om: 'Maallaqni biraan yoo ibsame malee herregni hundi Birrii Itoophiyaatiin (ETB) kan shallagamedha.',
    zh: '除非另有明确说明，所有财务金额均以埃塞俄比亚比尔 (ETB) 计价。',
  },
];

export function getTemplateTitle(template: OfficialDocTemplateType, lang: LanguageCode): string {
  return TEMPLATE_TITLES[template]?.[lang] ?? TEMPLATE_TITLES[template]?.en ?? template;
}

export function generateDocumentDraft(
  template: OfficialDocTemplateType,
  lang: LanguageCode,
  recipientName: string,
  department: string,
  amount?: number,
  currency = 'ETB'
): { subject: string; body: string } {
  const title = getTemplateTitle(template, lang);
  const greeting = `${SALUTATIONS[lang]} ${recipientName || 'Valued Partner'},`;
  const closing = CLOSINGS[lang];
  const baseIntro = PHRASE_DICTIONARY[0][lang];

  let middle = PHRASE_DICTIONARY[3][lang];
  if (template === 'Salary Certificate' || template === 'Employment Contract') {
    middle = PHRASE_DICTIONARY[1][lang];
  } else if (
    template === 'Goods Receiving Note' ||
    template === 'Material Issue Voucher' ||
    template === 'Stock Transfer Form' ||
    template === 'Delivery Note'
  ) {
    middle = PHRASE_DICTIONARY[2][lang];
  } else if (
    template === 'Sales Invoice' ||
    template === 'Payment Receipt' ||
    template === 'Payment Voucher' ||
    template === 'Receipt Voucher' ||
    template === 'Purchase Order'
  ) {
    middle = PHRASE_DICTIONARY[4][lang];
  }

  const amountLine =
    amount && amount > 0
      ? lang === 'am'
        ? `ጠቅላላ መጠን፡ ${amount.toLocaleString()} ${currency}`
        : lang === 'om'
        ? `Ida’ama Maallaqaa: ${amount.toLocaleString()} ${currency}`
        : lang === 'zh'
        ? `总金额：${amount.toLocaleString()} ${currency}`
        : `Total Amount: ${amount.toLocaleString()} ${currency}`
      : '';

  const deptLine =
    lang === 'am'
      ? `የሚመለከተው ክፍል፡ ${department}`
      : lang === 'om'
      ? `Kutaa Ilaallatu: ${department}`
      : lang === 'zh'
      ? `相关部门：${department}`
      : `Department: ${department}`;

  const body = [greeting, '', baseIntro, '', middle, '', deptLine, amountLine, '', closing]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');

  return {
    subject: `${title} — ${recipientName || department}`,
    body,
  };
}

export function translateDocumentText(
  sourceText: string,
  fromLang: LanguageCode,
  toLang: LanguageCode,
  template: OfficialDocTemplateType,
  recipientName: string,
  department: string,
  amount?: number,
  currency = 'ETB'
): string {
  if (fromLang === toLang) return sourceText;
  let translated = sourceText;
  let matchedPhrase = false;

  for (const entry of PHRASE_DICTIONARY) {
    if (translated.includes(entry[fromLang])) {
      translated = translated.replaceAll(entry[fromLang], entry[toLang]);
      matchedPhrase = true;
    }
  }

  if (translated.includes(SALUTATIONS[fromLang])) {
    translated = translated.replaceAll(SALUTATIONS[fromLang], SALUTATIONS[toLang]);
    matchedPhrase = true;
  }
  if (translated.includes(CLOSINGS[fromLang])) {
    translated = translated.replaceAll(CLOSINGS[fromLang], CLOSINGS[toLang]);
    matchedPhrase = true;
  }

  if (matchedPhrase) {
    return translated;
  }

  // Structured bilingual conversion preserving custom text + official translation header
  const draft = generateDocumentDraft(template, toLang, recipientName, department, amount, currency);
  return `${draft.body}\n\n[${LANGUAGE_LABELS[fromLang]} Reference]\n${sourceText}`;
}
