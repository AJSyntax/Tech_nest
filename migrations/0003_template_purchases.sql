-- Add isPremiumTemplate and isPurchased fields to portfolios table
ALTER TABLE portfolios ADD COLUMN is_premium_template INTEGER NOT NULL DEFAULT 0;
ALTER TABLE portfolios ADD COLUMN is_purchased INTEGER NOT NULL DEFAULT 0;

-- Create template_purchases table
CREATE TABLE IF NOT EXISTS template_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  template_id INTEGER NOT NULL REFERENCES templates(id),
  portfolio_id INTEGER REFERENCES portfolios(id),
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at INTEGER,
  approved_by INTEGER REFERENCES users(id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_template_purchases_user_id ON template_purchases(user_id);
CREATE INDEX idx_template_purchases_template_id ON template_purchases(template_id);
CREATE INDEX idx_template_purchases_status ON template_purchases(status);
