# AI Model Price Comparison

This project provides a user interface for comparing AI model pricing from various providers. It uses Supabase for the backend and real-time updates, and Framer Motion for animations.

![App Page](https://rvwyqbyxqenenohwlytj.supabase.co/storage/v1/object/public/site_files/app%20page.png?t=2024-08-07T08%3A08%3A54.611Z)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
- [Supabase](https://supabase.com/)
- [ExchangeRates API Key](https://apilayer.com/marketplace/exchangerates_data-api)

### Installation

1. **Clone the Repository**

    ```sh
    git clone https://github.com/shershah1024/ai-model-price-comparison.git
    cd ai-model-price-comparison
    ```

2. **Create a Project on Supabase**

    - Go to [Supabase](https://supabase.com/) and create a new project.
    - Get your Supabase URL and Anon Key from the project settings.

3. **Run SQL Functions and Create Tables**

    - Go to the SQL Editor in Supabase and run the following SQL to create the required table and functions:

    ```sql
    -- Select all users from auth.users
    SELECT * FROM auth.users;

    -- Create the table to store AI model pricing data
    CREATE TABLE ai_model_prices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      model_name TEXT NOT NULL UNIQUE,
      input_price NUMERIC(10, 6) NOT NULL,
      output_price NUMERIC(10, 6) NOT NULL,
      provider TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Enable row-level security
    ALTER TABLE ai_model_prices ENABLE ROW LEVEL SECURITY;

    -- Create a policy to allow all operations (adjust as needed for your security requirements)
    CREATE POLICY "Allow all operations for authenticated users" ON ai_model_prices
      FOR ALL USING (auth.role() = 'authenticated');

    -- Function to insert or update a model's pricing data
    CREATE OR REPLACE FUNCTION upsert_model_price(
      p_model_name TEXT,
      p_input_price NUMERIC,
      p_output_price NUMERIC,
      p_provider TEXT
    ) RETURNS SETOF ai_model_prices AS $$
    BEGIN
      RETURN QUERY
      INSERT INTO ai_model_prices (model_name, input_price, output_price, provider)
      VALUES (p_model_name, p_input_price, p_output_price, p_provider)
      ON CONFLICT (model_name) 
      DO UPDATE SET 
        input_price = EXCLUDED.input_price,
        output_price = EXCLUDED.output_price,
        provider = EXCLUDED.provider,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Enable real-time subscriptions for the table
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_model_prices;
    ```

    - You can find the SQL Editor in Supabase as shown in the image below:

    ![Supabase SQL Editor](https://rvwyqbyxqenenohwlytj.supabase.co/storage/v1/object/public/site_files/supabase_sql.png?t=2024-08-07T06%3A52%3A36.319Z)

4. **Get the ExchangeRates API Key**

    - Go to [ExchangeRates Data API](https://apilayer.com/marketplace/exchangerates_data-api) and sign up to get your API key.

5. **Configure Environment Variables**

    - Rename `.env.local.example` to `.env.local` and fill in your Supabase URL, Anon Key, and ExchangeRates API Key:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    NEXT_PUBLIC_EXCHANGE_RATES_API_KEY=your-exchange-rates-api-key
    ```

6. **Install Dependencies**

    ```sh
    npm install
    ```

7. **Run the Development Server**

    ```sh
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.

## Usage

- Add new AI model pricing data using the form.
- Edit existing AI model pricing data.
- View real-time updates of AI model pricing data as they are added or updated.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
