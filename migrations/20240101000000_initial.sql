-- Create initial schema for Moonsbow Core

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255), tenant_id UUID, is_active BOOLEAN NOT NULL, is_superuser BOOLEAN NOT NULL, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_users_tenant_id ON users (tenant_id);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_id ON users (id);

CREATE TABLE tenants (name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, plan VARCHAR(50) NOT NULL, is_active BOOLEAN NOT NULL, description VARCHAR(1000), id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE UNIQUE INDEX ix_tenants_slug ON tenants (slug);

CREATE INDEX ix_tenants_id ON tenants (id);

CREATE TABLE subscriptions (tenant_id UUID NOT NULL, plan VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, started_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE, external_id VARCHAR(255), id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_subscriptions_tenant_id ON subscriptions (tenant_id);

CREATE INDEX ix_subscriptions_id ON subscriptions (id);

CREATE TABLE platform_events (tenant_id UUID NOT NULL, event_type VARCHAR(100) NOT NULL, source VARCHAR(100) NOT NULL, payload JSON, status VARCHAR(50) NOT NULL, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_platform_events_event_type ON platform_events (event_type);

CREATE INDEX ix_platform_events_id ON platform_events (id);

CREATE INDEX ix_platform_events_tenant_id ON platform_events (tenant_id);

CREATE TABLE notifications (tenant_id UUID NOT NULL, user_id UUID, type VARCHAR(50) NOT NULL, subject VARCHAR(255), content TEXT NOT NULL, is_read BOOLEAN NOT NULL, sent_at TIMESTAMP WITH TIME ZONE, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_notifications_tenant_id ON notifications (tenant_id);

CREATE INDEX ix_notifications_id ON notifications (id);

CREATE INDEX ix_notifications_user_id ON notifications (user_id);

CREATE TABLE lms_courses (tenant_id UUID NOT NULL, title VARCHAR(255) NOT NULL, description TEXT, instructor_id UUID, is_published BOOLEAN NOT NULL, price FLOAT NOT NULL, max_students INTEGER, category VARCHAR(100), id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_lms_courses_id ON lms_courses (id);

CREATE INDEX ix_lms_courses_tenant_id ON lms_courses (tenant_id);

CREATE TABLE lms_enrollments (tenant_id UUID NOT NULL, course_id UUID NOT NULL, student_id UUID NOT NULL, status VARCHAR(50) NOT NULL, progress FLOAT NOT NULL, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_lms_enrollments_tenant_id ON lms_enrollments (tenant_id);

CREATE INDEX ix_lms_enrollments_course_id ON lms_enrollments (course_id);

CREATE INDEX ix_lms_enrollments_id ON lms_enrollments (id);

CREATE INDEX ix_lms_enrollments_student_id ON lms_enrollments (student_id);

CREATE TABLE restaurant_menu_items (tenant_id UUID NOT NULL, name VARCHAR(255) NOT NULL, description TEXT, price FLOAT NOT NULL, category VARCHAR(100), is_available BOOLEAN NOT NULL, image_url VARCHAR(500), id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_restaurant_menu_items_tenant_id ON restaurant_menu_items (tenant_id);

CREATE INDEX ix_restaurant_menu_items_id ON restaurant_menu_items (id);

CREATE TABLE restaurant_orders (tenant_id UUID NOT NULL, customer_id UUID, status VARCHAR(50) NOT NULL, total_amount FLOAT NOT NULL, items JSON, notes TEXT, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE INDEX ix_restaurant_orders_id ON restaurant_orders (id);

CREATE INDEX ix_restaurant_orders_tenant_id ON restaurant_orders (tenant_id);

CREATE TABLE finance_transactions (tenant_id UUID NOT NULL, reference VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, amount FLOAT NOT NULL, currency VARCHAR(10) NOT NULL, status VARCHAR(50) NOT NULL, description TEXT, metadata JSON, user_id UUID, id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, PRIMARY KEY (id));

CREATE UNIQUE INDEX ix_finance_transactions_reference ON finance_transactions (reference);

CREATE INDEX ix_finance_transactions_id ON finance_transactions (id);

CREATE INDEX ix_finance_transactions_tenant_id ON finance_transactions (tenant_id);
