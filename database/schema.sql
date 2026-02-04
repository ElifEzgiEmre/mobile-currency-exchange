-- Mobil Döviz Değişim Sistemi – Örnek SQL Şeması

CREATE TABLE users (
    user_id      SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    wallet_id  SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(user_id),
    currency   VARCHAR(10) NOT NULL,
    balance    NUMERIC(18, 2) NOT NULL DEFAULT 0
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(user_id),
    wallet_id      INTEGER NOT NULL REFERENCES wallets(wallet_id),
    type           VARCHAR(10) NOT NULL, -- BUY / SELL
    currency_pair  VARCHAR(10) NOT NULL, -- Örn: USD/TRY
    amount         NUMERIC(18, 2) NOT NULL,
    rate           NUMERIC(18, 6) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exchange_rates (
    rate_id        SERIAL PRIMARY KEY,
    base_currency  VARCHAR(10) NOT NULL,
    target_currency VARCHAR(10) NOT NULL,
    rate           NUMERIC(18, 6) NOT NULL,
    timestamp      TIMESTAMP NOT NULL
);

CREATE TABLE notification_settings (
    setting_id     SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(user_id),
    currency_pair  VARCHAR(10) NOT NULL,
    threshold_value NUMERIC(18, 6) NOT NULL,
    direction      VARCHAR(5) NOT NULL, -- UP / DOWN
    is_active      BOOLEAN NOT NULL DEFAULT TRUE
);



