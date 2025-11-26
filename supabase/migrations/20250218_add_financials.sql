/*
  # Atualização Financeira e de Estoque

  ## Query Description:
  Adiciona campos para suporte a descontos nos pedidos e congelamento de preço nos itens.
  Isso é seguro e não apaga dados existentes.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - orders: discount_type (text), discount_value (numeric)
  - order_items: unit_price (numeric) - para salvar o preço no momento da venda
*/

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed', -- 'fixed' ou 'percent'
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
