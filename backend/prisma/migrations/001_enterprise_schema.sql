-- ============================================================
-- Enterprise Multi-Tenant Schema Migration
-- Version: 2.0.0  |  Engine: InnoDB  |  Charset: utf8mb4
-- Run AFTER the base schema.sql has been applied
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- EXTEND hotels table with enterprise fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE `hotels`
  ADD COLUMN IF NOT EXISTS `hotel_code`        VARCHAR(50)  COMMENT 'Unique short code' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `contact_person`    VARCHAR(255) AFTER `name`,
  ADD COLUMN IF NOT EXISTS `mobile`            VARCHAR(30)  AFTER `contact_person`,
  ADD COLUMN IF NOT EXISTS `address`           TEXT         AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `gst_number`        VARCHAR(20)  AFTER `address`,
  ADD COLUMN IF NOT EXISTS `billing_cycle`     ENUM('monthly','quarterly','annual') NOT NULL DEFAULT 'monthly' AFTER `plan`,
  ADD COLUMN IF NOT EXISTS `status`            ENUM('trial','active','suspended','expired') NOT NULL DEFAULT 'trial' AFTER `billing_cycle`,
  ADD COLUMN IF NOT EXISTS `suspended_at`      DATETIME     AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `suspension_reason` TEXT         AFTER `suspended_at`,
  ADD COLUMN IF NOT EXISTS `trial_ends_at`     DATETIME     AFTER `suspension_reason`;

-- Extend Plan ENUM to include new plans
ALTER TABLE `hotels`
  MODIFY COLUMN `plan` ENUM('trial','basic','standard','premium','enterprise','starter','professional') NOT NULL DEFAULT 'trial';

-- Add unique constraint on hotel_code if data exists
-- UPDATE hotels SET hotel_code = CONCAT('HTL', LPAD(id, 6, '0')) WHERE hotel_code IS NULL;
ALTER TABLE `hotels`
  ADD UNIQUE KEY IF NOT EXISTS `uq_hotels_hotel_code` (`hotel_code`);

-- ─────────────────────────────────────────────────────────────
-- EXTEND users table with enterprise fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `phone`                VARCHAR(30) AFTER `name`,
  ADD COLUMN IF NOT EXISTS `force_password_change` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `password_changed_at`  DATETIME   AFTER `force_password_change`,
  ADD COLUMN IF NOT EXISTS `mfa_enabled`           TINYINT(1) NOT NULL DEFAULT 0 AFTER `password_changed_at`,
  ADD COLUMN IF NOT EXISTS `mfa_secret`            VARCHAR(255) AFTER `mfa_enabled`,
  ADD COLUMN IF NOT EXISTS `failed_attempts`       INT NOT NULL DEFAULT 0 AFTER `mfa_secret`,
  ADD COLUMN IF NOT EXISTS `locked_until`          DATETIME AFTER `failed_attempts`,
  ADD COLUMN IF NOT EXISTS `last_login_ip`         VARCHAR(45) AFTER `last_login_at`;

-- Extend Role ENUM
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('admin','manager','agent','owner','general_manager','front_office','reservations','marketing','accountant','custom') NOT NULL DEFAULT 'agent';

-- ─────────────────────────────────────────────────────────────
-- SUPER ADMINS  (platform operators — separate from hotels)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `super_admins` (
  `id`               VARCHAR(36)  NOT NULL,
  `email`            VARCHAR(255) NOT NULL,
  `password_hash`    VARCHAR(255) NOT NULL,
  `name`             VARCHAR(255) NOT NULL,
  `role`             ENUM('super_admin','admin','support','billing') NOT NULL DEFAULT 'support',
  `is_active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `mfa_enabled`      TINYINT(1)   NOT NULL DEFAULT 0,
  `mfa_secret`       VARCHAR(255),
  `last_login_at`    DATETIME,
  `last_login_ip`    VARCHAR(45),
  `failed_attempts`  INT          NOT NULL DEFAULT 0,
  `locked_until`     DATETIME,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_super_admins_email` (`email`),
  INDEX `idx_sa_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- REFRESH TOKENS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`             VARCHAR(36)  NOT NULL,
  `token_hash`     VARCHAR(64)  NOT NULL COMMENT 'SHA-256 hash of the token',
  `user_id`        VARCHAR(36)  COMMENT 'NULL for super admin tokens',
  `super_admin_id` VARCHAR(36)  COMMENT 'NULL for hotel user tokens',
  `user_agent`     VARCHAR(500),
  `ip`             VARCHAR(45),
  `expires_at`     DATETIME     NOT NULL,
  `revoked_at`     DATETIME,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rt_token_hash` (`token_hash`),
  INDEX `idx_rt_user_id` (`user_id`),
  INDEX `idx_rt_super_admin_id` (`super_admin_id`),
  INDEX `idx_rt_expires_at` (`expires_at`),
  CONSTRAINT `fk_rt_user`        FOREIGN KEY (`user_id`)        REFERENCES `users`        (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_super_admin` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTION PLANS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`                     VARCHAR(36)  NOT NULL,
  `name`                   VARCHAR(100) NOT NULL COMMENT 'Internal key e.g. premium_monthly',
  `display_name`           VARCHAR(255) NOT NULL,
  `plan`                   ENUM('trial','basic','standard','premium','enterprise','starter','professional') NOT NULL,
  `monthly_price`          INT          NOT NULL DEFAULT 0 COMMENT 'Price in paise/cents',
  `annual_price`           INT          NOT NULL DEFAULT 0,
  `max_users`              INT          NOT NULL DEFAULT 5,
  `max_contacts`           INT          NOT NULL DEFAULT 1000,
  `max_campaigns`          INT          NOT NULL DEFAULT 10 COMMENT 'Per month',
  `max_whatsapp_numbers`   INT          NOT NULL DEFAULT 1,
  `max_api_calls_per_month` INT         NOT NULL DEFAULT 10000,
  `max_automations`        INT          NOT NULL DEFAULT 5,
  `features`               JSON         NOT NULL COMMENT 'Feature flag list',
  `is_active`              TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sp_name` (`name`),
  INDEX `idx_sp_plan` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS  (one active subscription per hotel)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`                    VARCHAR(36)  NOT NULL,
  `hotel_id`              VARCHAR(36)  NOT NULL,
  `plan_id`               VARCHAR(36)  NOT NULL,
  `status`                ENUM('trial','active','past_due','expired','cancelled') NOT NULL DEFAULT 'trial',
  `billing_cycle`         ENUM('monthly','quarterly','annual') NOT NULL DEFAULT 'monthly',
  `current_period_start`  DATETIME     NOT NULL,
  `current_period_end`    DATETIME     NOT NULL,
  `auto_renew`            TINYINT(1)   NOT NULL DEFAULT 1,
  `cancelled_at`          DATETIME,
  `cancel_reason`         TEXT,
  `notes`                 TEXT,
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscriptions_hotel` (`hotel_id`),
  INDEX `idx_sub_plan_id` (`plan_id`),
  INDEX `idx_sub_status` (`status`),
  INDEX `idx_sub_period_end` (`current_period_end`),
  CONSTRAINT `fk_sub_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`             (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_plan`  FOREIGN KEY (`plan_id`)  REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`              VARCHAR(36)  NOT NULL,
  `invoice_number`  VARCHAR(50)  NOT NULL COMMENT 'e.g. INV-2026-00001',
  `hotel_id`        VARCHAR(36)  NOT NULL,
  `subscription_id` VARCHAR(36),
  `subtotal`        INT          NOT NULL DEFAULT 0 COMMENT 'In paise/cents',
  `tax_amount`      INT          NOT NULL DEFAULT 0,
  `tax_percent`     DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total`           INT          NOT NULL DEFAULT 0,
  `currency`        VARCHAR(3)   NOT NULL DEFAULT 'INR',
  `status`          ENUM('draft','sent','paid','overdue','void') NOT NULL DEFAULT 'draft',
  `due_date`        DATETIME     NOT NULL,
  `paid_at`         DATETIME,
  `sent_at`         DATETIME,
  `notes`           TEXT,
  `line_items`      JSON         NOT NULL,
  `billing_address` JSON,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  INDEX `idx_inv_hotel_id` (`hotel_id`),
  INDEX `idx_inv_status` (`status`),
  INDEX `idx_inv_due_date` (`due_date`),
  CONSTRAINT `fk_inv_hotel` FOREIGN KEY (`hotel_id`)        REFERENCES `hotels`        (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_sub`   FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id`                  VARCHAR(36)  NOT NULL,
  `invoice_id`          VARCHAR(36)  NOT NULL,
  `hotel_id`            VARCHAR(36)  NOT NULL,
  `amount`              INT          NOT NULL COMMENT 'In paise/cents',
  `currency`            VARCHAR(3)   NOT NULL DEFAULT 'INR',
  `gateway`             ENUM('razorpay','stripe','paypal','manual') NOT NULL,
  `gateway_order_id`    VARCHAR(255),
  `gateway_payment_id`  VARCHAR(255),
  `status`              ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `failure_reason`      VARCHAR(500),
  `metadata`            JSON,
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_gateway_id` (`gateway_payment_id`),
  INDEX `idx_pay_invoice_id` (`invoice_id`),
  INDEX `idx_pay_hotel_id` (`hotel_id`),
  INDEX `idx_pay_status` (`status`),
  CONSTRAINT `fk_pay_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOGS  (immutable — no UPDATE/DELETE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hotel_id`       VARCHAR(36),
  `user_id`        VARCHAR(36),
  `super_admin_id` VARCHAR(36),
  `action`         VARCHAR(100)   NOT NULL COMMENT 'e.g. user.create, campaign.delete',
  `resource`       VARCHAR(100)   NOT NULL COMMENT 'table/entity name',
  `resource_id`    VARCHAR(36),
  `old_values`     JSON,
  `new_values`     JSON,
  `ip`             VARCHAR(45),
  `user_agent`     VARCHAR(500),
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_al_hotel_id`       (`hotel_id`),
  INDEX `idx_al_user_id`        (`user_id`),
  INDEX `idx_al_super_admin_id` (`super_admin_id`),
  INDEX `idx_al_action`         (`action`),
  INDEX `idx_al_resource`       (`resource`, `resource_id`),
  INDEX `idx_al_created_at`     (`created_at`),
  CONSTRAINT `fk_audit_hotel`  FOREIGN KEY (`hotel_id`)       REFERENCES `hotels`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_user`   FOREIGN KEY (`user_id`)        REFERENCES `users`        (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_sadmin` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────
-- DEFAULT SUBSCRIPTION PLANS SEED
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `subscription_plans`
  (`id`,`name`,`display_name`,`plan`,`monthly_price`,`annual_price`,
   `max_users`,`max_contacts`,`max_campaigns`,`max_whatsapp_numbers`,
   `max_api_calls_per_month`,`max_automations`,`features`,`is_active`)
VALUES
('sp-trial','trial','Trial (14 days)','trial',0,0,
  3,500,3,1,1000,2,
  '["inbox","templates","campaigns","automation"]',1),

('sp-basic','basic','Basic','basic',99900,999900,
  5,2000,10,1,5000,5,
  '["inbox","templates","campaigns","automation","analytics"]',1),

('sp-standard','standard','Standard','standard',199900,1999900,
  15,10000,30,2,20000,15,
  '["inbox","templates","campaigns","automation","analytics","api","bulk_csv"]',1),

('sp-premium','premium','Premium','premium',399900,3999900,
  50,50000,100,3,100000,50,
  '["inbox","templates","campaigns","automation","analytics","api","bulk_csv","webhooks","custom_roles"]',1),

('sp-enterprise','enterprise','Enterprise','enterprise',0,0,
  999,999999,9999,10,9999999,999,
  '["inbox","templates","campaigns","automation","analytics","api","bulk_csv","webhooks","custom_roles","white_label","dedicated_support","sla"]',1);

-- Default Super Admin (password: SuperAdmin@123 — CHANGE IMMEDIATELY)
-- Hash generated with bcryptjs cost=12
INSERT IGNORE INTO `super_admins`
  (`id`,`email`,`password_hash`,`name`,`role`,`is_active`,`updated_at`)
VALUES
('sa-001','superadmin@eglobe.com',
  '$2a$12$2ovGG7qcGfoeGIyQvJW4XOtymw25dn4QIZogpkdpOT8pk2pyXimji',
  'Platform Super Admin','super_admin',1,NOW());

-- ============================================================
-- END OF ENTERPRISE MIGRATION
-- ============================================================
