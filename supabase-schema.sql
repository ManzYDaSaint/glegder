-- ==============================================================================
-- GLEGDER SUPABASE POSTGRESQL SCHEMA (Multi-Tenant with Shop Accounts)
-- Paste this entire script into your Supabase SQL Editor and click 'Run'.
-- ==============================================================================

-- 1. Create Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    currency TEXT DEFAULT 'MWK',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Transactions Table (Cash In & Cash Out)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Loans Table (Credit Book / Ngongole)
CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('GIVEN', 'REPAID')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add column if upgrading existing database tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'shop_id') THEN
        ALTER TABLE public.transactions ADD COLUMN shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'shop_id') THEN
        ALTER TABLE public.customers ADD COLUMN shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'shop_id') THEN
        ALTER TABLE public.loans ADD COLUMN shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create Fast Query Indices
CREATE INDEX IF NOT EXISTS idx_shops_phone ON public.shops (phone);
CREATE INDEX IF NOT EXISTS idx_tx_shop ON public.transactions (shop_id);
CREATE INDEX IF NOT EXISTS idx_tx_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON public.customers (shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_loans_shop ON public.loans (shop_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON public.loans (customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans (due_date ASC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 7. Policies for mobile client access
DROP POLICY IF EXISTS "Allow anon manage shops" ON public.shops;
CREATE POLICY "Allow anon manage shops" 
ON public.shops FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert & read transactions" ON public.transactions;
CREATE POLICY "Allow anon insert & read transactions" 
ON public.transactions FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert & read customers" ON public.customers;
CREATE POLICY "Allow anon insert & read customers" 
ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert & read loans" ON public.loans;
CREATE POLICY "Allow anon insert & read loans" 
ON public.loans FOR ALL TO anon USING (true) WITH CHECK (true);
