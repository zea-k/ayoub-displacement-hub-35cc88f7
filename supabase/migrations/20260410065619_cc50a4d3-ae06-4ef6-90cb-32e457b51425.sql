
ALTER TABLE public.day_closings ADD COLUMN total_expenses numeric NOT NULL DEFAULT 0;
ALTER TABLE public.day_closings ADD COLUMN net_profit numeric NOT NULL DEFAULT 0;
