export const getMockLoanDetails = () => [
  {
    // Внутренний потребкредит банка под 13.5% с остатком долга
    id: 'mock-loan-internal-1',
    agreement_id: 'mock-loan-internal-1',
    source: 'internal',
    product_type: 'loan',
    amount: 450000,
    currency: 'RUB',
    interest_rate: 13.5,
    term_months: 40,
    remaining_term_months: 40,
    origin_bank: 'self',
    account_number: '40817810099910004312',
    balance: [
      {
        amount: 450000,
        currency: 'RUB',
      },
    ],
  },
  {
    // Внешний кредит другого банка под 9.2% (например, ипотека)
    id: 'mock-loan-external-1',
    agreement_id: 'mock-loan-external-1',
    source: 'external',
    product_type: 'loan',
    amount: 900000,
    currency: 'RUB',
    interest_rate: 9.2,
    term_months: 96,
    remaining_term_months: 96,
    origin_bank: 'vbank',
    account_number: '40817810099910001234',
    balance: [
      {
        amount: 900000,
        currency: 'RUB',
      },
    ],
  },
];

export const getMockBankProducts = () => [
  {
    id: 'mock-refi-9',
    bank_code: 'self',
    name: 'Вау кредит под 9% (мок)',
    min_rate: 9,
    max_rate: 9,
    term_months: { min: 12, max: 60 },
    max_amount: 1500000,
    processing_fee: 0,
  },
  {
    id: 'mock-refi-1',
    bank_code: 'vbank',
    name: 'VBank Refinancing 9.5%',
    min_rate: 9.5,
    max_rate: 11,
    term_months: { min: 12, max: 84 },
    max_amount: 2000000,
    processing_fee: 0.5,
  },
  {
    id: 'mock-refi-2',
    bank_code: 'abank',
    name: 'ABank Cashback Loan',
    min_rate: 10,
    max_rate: 12,
    term_months: { min: 6, max: 84 },
    max_amount: 1500000,
    processing_fee: 1.5,
  },
];

export const getMockBankStatus = () => [
  { bank_code: 'vbank', status: 'online', response_time_ms: 120 },
  { bank_code: 'abank', status: 'degraded', response_time_ms: 480 },
  { bank_code: 'sbank', status: 'offline', response_time_ms: null },
];
