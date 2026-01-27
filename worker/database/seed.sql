-- Beautiful Table D1 Database Seed Data
-- This file populates the database with test data

-- Insert test users
INSERT INTO users (id, email, credits, total_purchased, created_at, last_login) VALUES
    ('user-1', 'test@example.com', 10, 0, datetime('now'), datetime('now')),
    ('user-2', 'alice@example.com', 15, 5, datetime('now', '-7 days'), datetime('now', '-1 hour')),
    ('user-3', 'bob@example.com', 25, 15, datetime('now', '-30 days'), datetime('now', '-1 day'));

-- Insert test usage logs
INSERT INTO usage_logs (user_id, operation, credits_used, timestamp) VALUES
    ('user-1', 'csv_parse', 1, datetime('now', '-2 hours')),
    ('user-1', 'csv_parse', 1, datetime('now', '-1 hour')),
    ('user-2', 'tsv_parse', 1, datetime('now', '-3 hours')),
    ('user-2', 'csv_parse', 1, datetime('now', '-2 hours')),
    ('user-2', 'excel_parse', 2, datetime('now', '-1 hour')),
    ('user-3', 'csv_parse', 1, datetime('now', '-5 hours')),
    ('user-3', 'tsv_parse', 1, datetime('now', '-4 hours')),
    ('user-3', 'excel_parse', 2, datetime('now', '-3 hours')),
    ('user-3', 'csv_parse', 1, datetime('now', '-2 hours')),
    ('user-3', 'excel_parse', 2, datetime('now', '-1 hour'));

-- Insert test transactions
INSERT INTO transactions (id, user_id, amount, credits_added, payment_id, status) VALUES
    ('txn-1', 'user-2', 5.00, 5, 'pay_1234567890', 'completed'),
    ('txn-2', 'user-3', 15.00, 15, 'pay_1234567891', 'completed'),
    ('txn-3', 'user-1', 10.00, 10, 'pay_1234567892', 'pending'),
    ('txn-4', 'user-2', 25.00, 25, 'pay_1234567893', 'pending'),
    ('txn-5', 'user-3', 50.00, 50, 'pay_1234567894', 'failed');
