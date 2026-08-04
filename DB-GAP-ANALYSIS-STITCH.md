# DB Gap Analysis vs `stitch/` (incremental)

This document tracks what already exists in the DB and what must be added to support the `stitch/` prototype modules.

## Existing DB coverage (already in `src/db/schema/*`)

- **Users**: `users` (includes coarse `user_role` enum)\n- **Suppliers**: `suppliers`\n- **Fabrics**: `fabrics`, `fabric_categories`, `fabric_activity_log`\n- **Leads/CRM**: `leads`, `lead_notes`, `lead_activity_log`\n- **Social**: `social_posts`\n- **Crawler**: `crawler_runs`, `raw_products`\n- **Admin settings**: `admin_settings`\n\n## High-impact missing foundations (implied by many stitch admin screens)

Added as schemas (migration pending):\n- **RBAC**: `roles`, `permissions`, `role_permissions`, `user_roles`\n- **Audit**: `audit_log`\n- **Security events**: `auth_security_events`\n- **Notifications**: `notifications`, `notification_settings`\n- **Integrations**: `api_keys`\n\n## Next domains (not implemented yet; will be phased)

- **Inventory/Orders/Logistics**: warehouses, inventory items/movements, orders, shipments, carriers, rates, tracking\n- **Billing/Finance**: subscriptions, invoices, payouts, withdrawals, commissions\n- **Content/CMS**: cms pages, blog posts, announcements, media assets, promotions\n- **Analytics/Reporting**: event tracking + report definitions + saved reports\n\n## Stitch module → DB mapping reference

See `STITCH-FEATURE-REGISTRY.md` for the full module list and planned entities per module.

