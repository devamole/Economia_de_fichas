-- a) Añadir configuración de canje por dinero a families
ALTER TABLE families
  ADD COLUMN money_exchange_rate    NUMERIC(10,4),
  ADD COLUMN money_currency         TEXT,
  ADD COLUMN money_exchange_enabled BOOLEAN NOT NULL DEFAULT false;

-- b) Añadir type a rewards para identificar la recompensa sentinel
ALTER TABLE rewards
  ADD COLUMN type TEXT NOT NULL DEFAULT 'standard'
  CHECK (type IN ('standard', 'money_exchange'));

-- c) Añadir money_value_at_redemption a reward_redemptions
ALTER TABLE reward_redemptions
  ADD COLUMN money_value_at_redemption NUMERIC(10,2);

-- d) RPC atómica para canjear puntos por dinero
CREATE OR REPLACE FUNCTION public.redeem_money_exchange(
  p_redeemed_by      UUID,
  p_points_to_redeem INT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family_id     UUID;
  v_rate          NUMERIC(10,4);
  v_currency      TEXT;
  v_enabled       BOOLEAN;
  v_balance       INT;
  v_reward_id     UUID;
  v_money_value   NUMERIC(10,2);
  v_redemption_id UUID;
BEGIN
  -- Obtener configuración de la familia del niño
  SELECT p.family_id, f.money_exchange_rate, f.money_currency, f.money_exchange_enabled
    INTO v_family_id, v_rate, v_currency, v_enabled
    FROM profiles p
    JOIN families f ON f.id = p.family_id
   WHERE p.id = p_redeemed_by;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF NOT v_enabled THEN
    RAISE EXCEPTION 'Money exchange not enabled';
  END IF;
  IF v_rate IS NULL OR v_rate <= 0 THEN
    RAISE EXCEPTION 'Exchange rate not configured';
  END IF;
  IF p_points_to_redeem < 1 THEN
    RAISE EXCEPTION 'Must exchange at least 1 point';
  END IF;

  -- Verificar y bloquear el saldo
  SELECT points_balance INTO v_balance FROM profiles WHERE id = p_redeemed_by FOR UPDATE;
  IF v_balance < p_points_to_redeem THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;

  -- Obtener la recompensa sentinel (debe existir, creada por configureMoneyExchange)
  SELECT id INTO v_reward_id FROM rewards
   WHERE family_id = v_family_id AND type = 'money_exchange'
   LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Money exchange reward not configured';
  END IF;

  -- Descontar puntos inmediatamente
  UPDATE profiles
     SET points_balance = points_balance - p_points_to_redeem
   WHERE id = p_redeemed_by;

  -- Calcular valor monetario
  v_money_value := ROUND(p_points_to_redeem * v_rate, 2);

  -- Insertar el canje con estado pendiente
  INSERT INTO reward_redemptions
    (reward_id, redeemed_by, cost_points_at_redemption, money_value_at_redemption, status)
  VALUES
    (v_reward_id, p_redeemed_by, p_points_to_redeem, v_money_value, 'pending')
  RETURNING id INTO v_redemption_id;

  RETURN json_build_object(
    'redemption_id', v_redemption_id,
    'cost_points',   p_points_to_redeem,
    'money_value',   v_money_value,
    'currency',      v_currency,
    'status',        'pending'
  );
END;
$$;
