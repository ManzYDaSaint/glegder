-- ==============================================================================
-- GLEGDER SUPABASE POSTGRESQL SCHEMA
-- Paste this entire script into your Supabase SQL Editor and click 'Run'.
-- ==============================================================================

-- 1. Create Transactions Table (Cash In & Cash Out)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Loans Table (Credit Book / Ngongole)
CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('GIVEN', 'REPAID')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Fast Query Indices
CREATE INDEX IF NOT EXISTS idx_tx_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON public.loans (customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans (due_date ASC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 6. Create Open Access Policies for anon public key
-- (Allows the Glegder mobile client to read and write records)
CREATE POLICY "Allow anon insert & read transactions" 
ON public.transactions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert & read customers" 
ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert & read loans" 
ON public.loans FOR ALL TO anon USING (true) WITH CHECK (true);
