'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchModelPrices, upsertModelPrice, subscribeToModelPrices, ModelPrice } from '../utils/supabase';

interface ModelPrices {
  [key: string]: {
    input: number;
    output: number;
    provider: string;
    totalPrice: number;
  };
}

interface CurrencyDropdownProps {
  value: string;
  onChange: (currency: string) => void;
  currencies: string[];
}

const formatPrice = (price: number): string => {
  if (price === 0) return '0';

  let formattedPrice = price.toFixed(3);
  formattedPrice = formattedPrice.replace(/\.?0+$/, '');

  if (formattedPrice.endsWith('.')) {
    formattedPrice = formattedPrice.slice(0, -1);
  }

  return formattedPrice;
};

const numberToWords = (num: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n >= 100) {
      return ones[Math.floor(n / 100)] + ' hundred ' + convertLessThanOneThousand(n % 100);
    }
    if (n >= 20) {
      return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
    }
    if (n >= 10) {
      return teens[n - 10];
    }
    return ones[n];
  };

  if (num === 0) return 'zero';

  let result = '';
  if (num >= 1000000) {
    result += convertLessThanOneThousand(Math.floor(num / 1000000)) + ' million ';
    num %= 1000000;
  }
  if (num >= 1000) {
    result += convertLessThanOneThousand(Math.floor(num / 1000)) + ' thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertLessThanOneThousand(num);
  }

  return result.trim();
};

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({ value, onChange, currencies }) => {
  const [search, setSearch] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const filteredCurrencies = currencies.filter(currency =>
    currency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Search currency..."
        className="w-full p-2 border rounded"
      />
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {filteredCurrencies.map((currency) => (
              <motion.li
                key={currency}
                onClick={() => {
                  onChange(currency);
                  setSearch('');
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                whileHover={{ backgroundColor: '#f0f0f0' }}
              >
                {currency}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ModelData {
  name: string;
  input: number;
  output: number;
  provider: string;
}

interface ModelFormProps {
  onSubmit: (model: ModelData) => void;
  initialData?: ModelData;
}

const ModelForm: React.FC<ModelFormProps> = ({ onSubmit, initialData = { name: '', input: 0, output: 0, provider: '' } }) => {
  const [model, setModel] = useState<ModelData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(model);
    setModel({ name: '', input: 0, output: 0, provider: '' });
    window.location.reload(); // Refresh the page
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="grid gap-4 md:grid-cols-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col">
        <label htmlFor="modelName" className="mb-1 text-sm font-medium">Model Name</label>
        <input
          id="modelName"
          type="text"
          value={model.name}
          onChange={(e) => setModel({ ...model, name: e.target.value })}
          required
          className="p-2 border rounded"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="inputPrice" className="mb-1 text-sm font-medium">Input Price/ Million Tokens(USD)</label>
        <input
          id="inputPrice"
          type="number"
          value={model.input}
          onChange={(e) => setModel({ ...model, input: parseFloat(e.target.value) })}
          placeholder="Input Price per 1M tokens"
          required
          step="0.001"
          className="p-2 border rounded"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="outputPrice" className="mb-1 text-sm font-medium">Output Price/ Million TKS(USD)</label>
        <input
          id="outputPrice"
          type="number"
          value={model.output}
          onChange={(e) => setModel({ ...model, output: parseFloat(e.target.value) })}
          placeholder="Output Price per 1M tokens"
          required
          step="0.001"
          className="p-2 border rounded"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="provider" className="mb-1 text-sm font-medium">Provider</label>
        <input
          id="provider"
          type="text"
          value={model.provider}
          onChange={(e) => setModel({ ...model, provider: e.target.value })}
          required
          className="p-2 border rounded"
        />
      </div>
      <motion.button
        type="submit"
        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 self-end"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {initialData.name ? 'Update Model' : 'Add Model'}
      </motion.button>
    </motion.form>
  );
};

interface AIPriceComparisonProps {
  initialCurrencies: string[];
  exchangeRates: { [key: string]: number };
}

const AIPriceComparison: React.FC<AIPriceComparisonProps> = ({ initialCurrencies, exchangeRates }) => {
  const [modelPrices, setModelPrices] = useState<ModelPrices>({});
  const [inputTokens, setInputTokens] = useState<string>('1000000');
  const [outputTokens, setOutputTokens] = useState<string>('1000000');
  const [currency, setCurrency] = useState<string>('USD');
  const [currencies] = useState<string[]>(initialCurrencies);
  const [editingModel, setEditingModel] = useState<ModelData | null>(null);
  const [isAddModelOpen, setIsAddModelOpen] = useState<boolean>(false);

  const fetchAndSetModelPrices = async () => {
    try {
      const prices = await fetchModelPrices();
      const modelPricesWithTotal = prices.map(item => ({
        ...item,
        totalPrice: item.input_price + item.output_price
      }));
      modelPricesWithTotal.sort((a, b) => b.totalPrice - a.totalPrice);
      setModelPrices(modelPricesWithTotal.reduce((acc, item) => ({
        ...acc,
        [item.model_name]: {
          input: item.input_price,
          output: item.output_price,
          provider: item.provider,
          totalPrice: item.totalPrice
        }
      }), {}));
    } catch (error) {
      console.error('Error fetching model prices:', error);
    }
  };

  useEffect(() => {
    fetchAndSetModelPrices();

    const subscription = subscribeToModelPrices((payload) => {
      console.log('Change received!', payload);
      fetchAndSetModelPrices();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculatePrice = (model: string, type: 'input' | 'output'): string => {
    const tokens = type === 'input' ? parseInt(inputTokens) : parseInt(outputTokens);
    const pricePerMillion = modelPrices[model][type];
    const exchangeRate = exchangeRates[currency] || 1;
    const price = pricePerMillion * tokens * exchangeRate / 1000000;
    return formatPrice(price);
  };

  const calculateTotalPrice = (model: string): string => {
    const inputPrice = parseFloat(calculatePrice(model, 'input'));
    const outputPrice = parseFloat(calculatePrice(model, 'output'));
    const totalPrice = inputPrice + outputPrice;
    return formatPrice(totalPrice);
  };

  const handleAddModel = async (newModel: ModelData) => {
    try {
      await upsertModelPrice(newModel);
      setIsAddModelOpen(false);
    } catch (error) {
      console.error('Error adding model:', error);
    }
  };

  const handleEditModel = async (updatedModel: ModelData) => {
    try {
      await upsertModelPrice(updatedModel);
      setEditingModel(null);
    } catch (error) {
      console.error('Error updating model:', error);
    }
  };

  const handleTokenChange = (setTokens: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow numeric values
      setTokens(value);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <motion.h1
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        AI Model Price Comparison
      </motion.h1>

      <motion.div className="text-center mb-4">
        <a 
          href="https://github.com/shershah1024/compare_AI_models" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline"
        >
          View on GitHub
        </a>
      </motion.div>

      <motion.div
        className="bg-white p-6 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Token Input</h2>
        <p className="mb-4 text-gray-600">Enter the number of tokens you want to process. This will be used to calculate the price for each model.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="inputTokens" className="block mb-2">Input Tokens:</label>
            <input
              id="inputTokens"
              type="text"
              value={inputTokens}
              onChange={handleTokenChange(setInputTokens)}
              className="w-full p-2 border rounded"
            />
            <p className="mt-1 text-sm text-gray-500">{numberToWords(parseInt(inputTokens) || 0)} tokens</p>
          </div>
          <div>
            <label htmlFor="outputTokens" className="block mb-2">Output Tokens:</label>
            <input
              id="outputTokens"
              type="text"
              value={outputTokens}
              onChange={handleTokenChange(setOutputTokens)}
              className="w-full p-2 border rounded"
            />
            <p className="mt-1 text-sm text-gray-500">{numberToWords(parseInt(outputTokens) || 0)} tokens</p>
          </div>
          <div>
            <label htmlFor="currency" className="block mb-2">Currency:</label>
            <CurrencyDropdown value={currency} onChange={setCurrency} currencies={currencies} />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white p-6 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold mb-4">Price Comparison - Highest to Lowest</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Model</th>
                <th className="p-2 text-left">Provider</th>
                <th className="p-2 text-right">Input Price</th>
                <th className="p-2 text-right">Output Price</th>
                <th className="p-2 text-right">Total Price</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(modelPrices).map(([model, prices]) => (
                <motion.tr
                  key={model}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b"
                >
                  <td className="p-2">{model}</td>
                  <td className="p-2">{prices.provider}</td>
                  <td className="p-2 text-right">{calculatePrice(model, 'input')} {currency}</td>
                  <td className="p-2 text-right">{calculatePrice(model, 'output')} {currency}</td>
                  <td className="p-2 text-right">{calculateTotalPrice(model)} {currency}</td>
                  <td className="p-2 text-center">
                    <motion.button
                      onClick={() => setEditingModel({ name: model, ...prices })}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        className="bg-white p-6 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.button
          onClick={() => setIsAddModelOpen(!isAddModelOpen)}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAddModelOpen ? 'Close Add Model' : 'Add New Model'}
        </motion.button>

        <AnimatePresence>
          {isAddModelOpen && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Add New Model</h2>
              <ModelForm onSubmit={handleAddModel} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {editingModel && (
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Edit Model: {editingModel.name}</h2>
            <ModelForm onSubmit={handleEditModel} initialData={editingModel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPriceComparison;
