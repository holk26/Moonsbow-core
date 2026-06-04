-- Add missing app_id columns and new tables

-- Add app_id to tenants
ALTER TABLE tenants ADD COLUMN app_id UUID NULL;
CREATE INDEX ix_tenants_app_id ON tenants (app_id);

-- Add app_id to subscriptions
ALTER TABLE subscriptions ADD COLUMN app_id UUID NULL;
CREATE INDEX ix_subscriptions_app_id ON subscriptions (app_id);

-- Add app_id to notifications
ALTER TABLE notifications ADD COLUMN app_id UUID NULL;
CREATE INDEX ix_notifications_app_id ON notifications (app_id);

-- Create apps table
CREATE TABLE apps (
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_apps_slug ON apps (slug);
CREATE UNIQUE INDEX ix_apps_api_key ON apps (api_key);
CREATE INDEX ix_apps_id ON apps (id);

-- Create webhook_subscriptions table
CREATE TABLE webhook_subscriptions (
    app_id UUID NOT NULL,
    event_types JSON NOT NULL DEFAULT '[]',
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX ix_webhook_subscriptions_app_id ON webhook_subscriptions (app_id);
CREATE INDEX ix_webhook_subscriptions_id ON webhook_subscriptions (id);
