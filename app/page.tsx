import React from 'react';
import dynamic from 'next/dynamic';

const AIPriceComparison = dynamic<{initialCurrencies: string[], exchangeRates: { [key: string]: number }}>(
  () => import('@/components/AIPriceComparison'),
  { ssr: false }
);

async function getInitialData() {
  const apiKey = process.env.EXCHANGE_RATES_API_KEY;
  
  if (!apiKey) {
    console.error('API key is not set');
    return {
      currencies: ['USD', 'EUR', 'GBP'],
      exchangeRates: { USD: 1, EUR: 0.85, GBP: 0.75 }
    };
  }

  try {
    const [currenciesResponse, ratesResponse] = await Promise.all([
      fetch('https://api.apilayer.com/exchangerates_data/symbols', {
        headers: { 'apikey': apiKey }
      }),
      fetch('https://api.apilayer.com/exchangerates_data/latest?base=USD', {
        headers: { 'apikey': apiKey }
      })
    ]);
    
    if (!currenciesResponse.ok || !ratesResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const currenciesData = await currenciesResponse.json();
    const ratesData = await ratesResponse.json();

    if (!currenciesData.symbols || !ratesData.rates) {
      throw new Error('Invalid data received from API');
    }

    return {
      currencies: Object.keys(currenciesData.symbols),
      exchangeRates: ratesData.rates
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      currencies: ['USD', 'EUR', 'GBP'],
      exchangeRates: { USD: 1, EUR: 0.85, GBP: 0.75 } // Fallback rates
    };
  }
}

export default async function AIPriceComparisonPage() {
  const { currencies, exchangeRates } = await getInitialData();

  return (
    <div className="container mx-auto p-4">
      <AIPriceComparison initialCurrencies={currencies} exchangeRates={exchangeRates} />
    </div>
  );
}