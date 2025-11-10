export const getMockLoanDetails = () => [
  {
    id: 'mock-loan-1',
    source: 'internal',
    product_type: 'loan',
    principal_amount: 350000,
    currency: 'RUB',
    interest_rate: 12.5,
    remaining_term_months: 36,
    origin_bank: 'self',
    account_number: '40817810099910004312',
  },
  {
    id: 'mock-loan-2',
    source: 'external',
    product_type: 'mortgage',
    principal_amount: 1200000,
    currency: 'RUB',
    interest_rate: 9.2,
    remaining_term_months: 204,
    origin_bank: 'vbank',
  },
];

export const getMockBankProducts = () => [
  {
    id: 'mock-refi-1',
    bank_code: 'vbank',
    name: 'VBank Refinancing 9%',
    min_rate: 9,
    max_rate: 11,
    term_months: { min: 12, max: 60 },
    max_amount: 2000000,
    processing_fee: 0,
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
