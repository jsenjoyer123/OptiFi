import { Router } from 'express';
import { bankApiClient, handleAxiosError } from '../../lib/bankApiClient.js';

const router = Router();

const ensureAuthToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const error = new Error('Authorization header is required');
    error.status = 401;
    throw error;
  }
  return authHeader;
};

const calculateRefinanceOffer = (loan) => {
  const principal = Number(loan.amount) || 0;
  const annualRate = Number(loan.interest_rate) || 18;
  const remainingMonths = Number(loan.term_months) || 24;

  const newRate = Math.max(annualRate - 3, 9);
  const monthlyRate = newRate / 12 / 100;
  const monthlyPayment =
    remainingMonths > 0
      ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -remainingMonths))
      : principal;

  return {
    loan_id: loan.agreement_id,
    original_rate: annualRate,
    suggested_rate: Number(newRate.toFixed(2)),
    monthly_payment: Number(monthlyPayment.toFixed(2)),
    total_cost: Number((monthlyPayment * remainingMonths).toFixed(2)),
    savings: Number(((annualRate - newRate) * principal * remainingMonths) / 1200).toFixed(2),
    assumptions: {
      term_months: remainingMonths,
      principal,
    },
  };
};

router.get('/suggestions', async (req, res) => {
  try {
    const authHeader = ensureAuthToken(req);
    const client = bankApiClient(authHeader);

    const agreementsResponse = await client.get('/product-agreements');
    const agreements = agreementsResponse.data?.data ?? [];

    const loanAgreements = agreements.filter((agreement) => agreement.product_type === 'loan');

    const enrichedLoans = loanAgreements.map((loan) => ({
      ...loan,
      refinance_offer: calculateRefinanceOffer(loan),
    }));

    res.json({
      data: enrichedLoans,
      meta: {
        total: enrichedLoans.length,
      },
    });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    const formatted = handleAxiosError(error);
    res.status(formatted.status).json({ error: formatted.message, details: formatted.data });
  }
});

export default router;
