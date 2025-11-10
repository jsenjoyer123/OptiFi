import axios from 'axios';
import { config } from '../config/env.js';
import { getMockLoanDetails } from './mockData.js';

const normalizeExternalLoan = (loan, bankCode) => ({
  ...loan,
  source: loan.source ?? 'external',
  origin_bank: loan.origin_bank ?? bankCode ?? 'external-bank',
});

export const fetchExternalLoans = async () => {
  if (config.useMockExternalBanks || config.useMockData) {
    return getMockLoanDetails().map((loan) => normalizeExternalLoan(loan, loan.origin_bank));
  }

  if (!Array.isArray(config.externalBanks) || !config.externalBanks.length) {
    return [];
  }

  const results = await Promise.all(
    config.externalBanks.map(async (bank) => {
      if (!bank.baseUrl) {
        return [];
      }

      const endpoint = `${bank.baseUrl.replace(/\/$/, '')}/loans`;

      try {
        const response = await axios.get(endpoint, {
          timeout: config.externalBankTimeoutMs,
          headers: {
            Accept: 'application/json',
            Authorization: bank.token ? `Bearer ${bank.token}` : undefined,
          },
        });

        const loans = Array.isArray(response.data?.data?.loans)
          ? response.data.data.loans
          : [];

        return loans.map((loan) => normalizeExternalLoan(loan, bank.code));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[externalLoansService] failed to fetch loans', {
          bank: bank.code,
          endpoint,
          message: error?.message,
          status: error?.response?.status,
        });
        return [];
      }
    }),
  );

  return results.flat();
};
