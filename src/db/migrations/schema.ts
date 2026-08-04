import { pgTable, index, unique, integer, text, timestamp, foreignKey, boolean, jsonb, numeric, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const adminAnnouncementImportance = pgEnum("admin_announcement_importance", ['LOW', 'MEDIUM', 'HIGH'])
export const adminRawProcessingStatus = pgEnum("admin_raw_processing_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'])
export const adminRawUploadRowStatus = pgEnum("admin_raw_upload_row_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
export const adminRawUploadStatus = pgEnum("admin_raw_upload_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
export const bulkImportJobStatus = pgEnum("bulk_import_job_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED'])
export const bulkOrderStatus = pgEnum("bulk_order_status", ['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'ON_HOLD'])
export const catalogExportFormat = pgEnum("catalog_export_format", ['CSV', 'XLSX', 'JSON'])
export const catalogExportStatus = pgEnum("catalog_export_status", ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'])
export const commissionHealth = pgEnum("commission_health", ['HEALTHY', 'UNDER_REVIEW', 'PAUSED'])
export const commissionTierMode = pgEnum("commission_tier_mode", ['FLAT', 'TIERED'])
export const crawlerJobStatus = pgEnum("crawler_job_status", ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'])
export const fabricStatus = pgEnum("fabric_status", ['raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected'])
export const integrationHealthDot = pgEnum("integration_health_dot", ['OK', 'WARN', 'ERROR'])
export const integrationStatus = pgEnum("integration_status", ['CONNECTED', 'ACTION_REQUIRED', 'INACTIVE'])
export const leadSource = pgEnum("lead_source", ['MARKETPLACE_INQUIRY', 'SAMPLE_REQUEST', 'SOCIAL_CAMPAIGN', 'DIRECT_CONTACT', 'MANUAL_ENTRY'])
export const leadStatus = pgEnum("lead_status", ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'])
export const logisticsCarrierHealth = pgEnum("logistics_carrier_health", ['OPERATIONAL', 'DELAYED', 'MAINTENANCE'])
export const logisticsCarrierServiceType = pgEnum("logistics_carrier_service_type", ['EXPRESS', 'ECONOMY', 'FREIGHT'])
export const logisticsCourierMode = pgEnum("logistics_courier_mode", ['AIR', 'ROAD', 'SEA', 'RAIL'])
export const logisticsShipmentStatus = pgEnum("logistics_shipment_status", ['IN_TRANSIT', 'DELAYED', 'CUSTOMS_HOLD', 'DELIVERED'])
export const rawProductSourceLanguage = pgEnum("raw_product_source_language", ['zh', 'en'])
export const socialActivityAction = pgEnum("social_activity_action", ['CREATED', 'UPDATED', 'APPROVED', 'SCHEDULED', 'UNSCHEDULED', 'PUBLISHED', 'FAILED', 'REJECTED', 'REOPENED', 'ANALYTICS_SYNCED', 'CREDENTIALS_CONNECTED', 'CREDENTIALS_DISCONNECTED', 'CREDENTIALS_REFRESHED'])
export const socialCampaignStatus = pgEnum("social_campaign_status", ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
export const socialContentType = pgEnum("social_content_type", ['REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN'])
export const socialPlatform = pgEnum("social_platform", ['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE'])
export const socialPostStatus = pgEnum("social_post_status", ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'VIDEO_PENDING'])
export const supplierDiscoveryProductStatus = pgEnum("supplier_discovery_product_status", ['NEW', 'READY', 'NEEDS_REVIEW', 'REJECTED'])
export const supplierDiscoveryRunStatus = pgEnum("supplier_discovery_run_status", ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'])
export const supplierDiscoverySupplierStatus = pgEnum("supplier_discovery_supplier_status", ['NEW', 'REVIEW_NEEDED', 'APPROVED_FOR_INGEST', 'REJECTED'])
export const supplierPayoutStatus = pgEnum("supplier_payout_status", ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'PAID'])
export const supplierReviewStatus = pgEnum("supplier_review_status", ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'])
export const supplierTier = pgEnum("supplier_tier", ['PLATINUM', 'GOLD', 'SILVER', 'STANDARD'])
export const supplierVerificationCaseStatus = pgEnum("supplier_verification_case_status", ['DRAFT', 'IN_PROGRESS', 'COMPLETED'])
export const supportKnowledgeCardLayout = pgEnum("support_knowledge_card_layout", ['WIDE', 'NARROW', 'FULL'])
export const supportTicketServiceArea = pgEnum("support_ticket_service_area", ['CRAWLER', 'AI', 'WEB', 'DATABASE'])
export const supportTicketUrgency = pgEnum("support_ticket_urgency", ['NORMAL', 'HIGH', 'CRITICAL'])
export const systemLogLevel = pgEnum("system_log_level", ['INFO', 'WARN', 'ERROR', 'CRITICAL'])
export const systemReleaseKind = pgEnum("system_release_kind", ['MAJOR', 'PATCH', 'FEATURE', 'HOTFIX'])
export const userRole = pgEnum("user_role", ['ADMIN', 'SALES', 'VIEWER'])


export const rawProducts = pgTable("raw_products", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "raw_products_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	source: text().notNull(),
	productUrl: text("product_url").notNull(),
	urlHash: text("url_hash").notNull(),
	rawTitle: text("raw_title").notNull(),
	rawDescription: text("raw_description"),
	rawComposition: text("raw_composition"),
	rawImages: text("raw_images").array(),
	supplierName: text("supplier_name"),
	priceText: text("price_text"),
	moqText: text("moq_text"),
	sourceLanguage: rawProductSourceLanguage("source_language").default('zh').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("raw_products_source_created_at_desc_idx").using("btree", table.source.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	unique("raw_products_product_url_unique").on(table.productUrl),
	unique("raw_products_url_hash_unique").on(table.urlHash),
]);

export const fabricCategories = pgTable("fabric_categories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fabricId: integer("fabric_id").notNull(),
	categorySlug: text("category_slug").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("fabric_categories_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "fabric_categories_fabric_id_fabrics_id_fk"
		}).onDelete("cascade"),
]);

export const suppliers = pgTable("suppliers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "suppliers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	slug: text().notNull(),
	country: text().default('China').notNull(),
	city: text(),
	province: text(),
	description: text(),
	logoUrl: text("logo_url"),
	websiteUrl: text("website_url"),
	verified: boolean().default(false).notNull(),
	establishedYear: integer("established_year"),
	sourceUrl: text("source_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("suppliers_slug_unique").on(table.slug),
]);

export const fabricActivityLog = pgTable("fabric_activity_log", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_activity_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fabricId: integer("fabric_id").notNull(),
	actorId: integer("actor_id"),
	eventType: text("event_type").notNull(),
	message: text().notNull(),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fabric_activity_log_actor_id_idx").using("btree", table.actorId.asc().nullsLast().op("int4_ops")),
	index("fabric_activity_log_created_at_desc_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("fabric_activity_log_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "fabric_activity_log_fabric_id_fabrics_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "fabric_activity_log_actor_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const leads = pgTable("leads", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "leads_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	source: leadSource().notNull(),
	status: leadStatus().default('NEW').notNull(),
	companyName: text("company_name").notNull(),
	contactName: text("contact_name").notNull(),
	email: text().notNull(),
	phone: text(),
	country: text().notNull(),
	city: text(),
	fabricId: integer("fabric_id"),
	inquiryText: text("inquiry_text").notNull(),
	assignedToId: integer("assigned_to_id"),
	utmSource: text("utm_source"),
	utmCampaign: text("utm_campaign"),
	utmMedium: text("utm_medium"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("leads_assigned_to_id_idx").using("btree", table.assignedToId.asc().nullsLast().op("int4_ops")),
	index("leads_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("leads_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("leads_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "leads_fabric_id_fabrics_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "leads_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const leadActivityLog = pgTable("lead_activity_log", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "lead_activity_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	leadId: integer("lead_id").notNull(),
	actorId: integer("actor_id"),
	eventType: text("event_type").notNull(),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("lead_activity_log_actor_id_idx").using("btree", table.actorId.asc().nullsLast().op("int4_ops")),
	index("lead_activity_log_lead_id_idx").using("btree", table.leadId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_activity_log_lead_id_leads_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "lead_activity_log_actor_id_users_id_fk"
		}),
]);

export const crawlerRuns = pgTable("crawler_runs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "crawler_runs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	status: crawlerJobStatus().default('PENDING').notNull(),
	source: text().notNull(),
	keywords: text().array().notNull(),
	productsFound: integer("products_found").default(0).notNull(),
	productsSaved: integer("products_saved").default(0).notNull(),
	errorsCount: integer("errors_count").default(0).notNull(),
	triggeredById: integer("triggered_by_id"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	errorLog: text("error_log"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("crawler_runs_triggered_by_id_idx").using("btree", table.triggeredById.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.triggeredById],
			foreignColumns: [users.id],
			name: "crawler_runs_triggered_by_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	email: text().notNull(),
	name: text().notNull(),
	role: userRole().default('VIEWER').notNull(),
	avatarUrl: text("avatar_url"),
	passwordHash: text("password_hash"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	totpSecret: text("totp_secret"),
	totpEnabled: boolean("totp_enabled").default(false).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const adminSettings = pgTable("admin_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	crawlerEnabled: boolean("crawler_enabled").default(true).notNull(),
	leadRateLimitPerHour: integer("lead_rate_limit_per_hour").default(5).notNull(),
	notificationEmail: text("notification_email"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	crawlerDefaultMaxProducts: integer("crawler_default_max_products").default(200).notNull(),
	leadOpsJson: jsonb("lead_ops_json").default({}).notNull(),
	systemAlertsJson: jsonb("system_alerts_json").default({}).notNull(),
});

export const leadNotes = pgTable("lead_notes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "lead_notes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	leadId: integer("lead_id").notNull(),
	authorId: integer("author_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("lead_notes_author_id_idx").using("btree", table.authorId.asc().nullsLast().op("int4_ops")),
	index("lead_notes_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("lead_notes_lead_id_idx").using("btree", table.leadId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_notes_lead_id_leads_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "lead_notes_author_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const roles = pgTable("roles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	key: text().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("roles_key_unique").on(table.key),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "role_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("role_permissions_permission_id_idx").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	index("role_permissions_role_id_idx").using("btree", table.roleId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
	unique("role_permissions_role_permission_unique").on(table.roleId, table.permissionId),
]);

export const permissions = pgTable("permissions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	key: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("permissions_key_unique").on(table.key),
]);

export const userRoles = pgTable("user_roles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "user_roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	roleId: integer("role_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("user_roles_role_id_idx").using("btree", table.roleId.asc().nullsLast().op("int4_ops")),
	index("user_roles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("restrict"),
	unique("user_roles_user_role_unique").on(table.userId, table.roleId),
]);

export const auditLog = pgTable("audit_log", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "audit_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	actorId: integer("actor_id"),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: integer("entity_id"),
	success: boolean().default(true).notNull(),
	message: text(),
	payload: jsonb(),
	ip: text(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("audit_log_actor_id_idx").using("btree", table.actorId.asc().nullsLast().op("int4_ops")),
	index("audit_log_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("audit_log_entity_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "audit_log_actor_id_users_id_fk"
		}).onDelete("set null"),
]);

export const authSecurityEvents = pgTable("auth_security_events", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "auth_security_events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id"),
	email: text(),
	eventType: text("event_type").notNull(),
	success: boolean().default(true).notNull(),
	ip: text(),
	userAgent: text("user_agent"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("auth_security_events_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("auth_security_events_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("auth_security_events_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_security_events_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const notificationSettings = pgTable("notification_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "notification_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	emailEnabled: boolean("email_enabled").default(true).notNull(),
	inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
	preferences: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("notification_settings_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("notification_settings_user_id_unique").on(table.userId),
]);

export const notifications = pgTable("notifications", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "notifications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	body: text(),
	data: jsonb(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	isHighPriority: boolean("is_high_priority").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("notifications_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("notifications_read_at_idx").using("btree", table.readAt.asc().nullsLast().op("timestamptz_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const apiKeys = pgTable("api_keys", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "api_keys_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	prefix: text().notNull(),
	keyHash: text("key_hash").notNull(),
	scopes: text().array(),
	createdById: integer("created_by_id"),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("api_keys_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("api_keys_created_by_id_idx").using("btree", table.createdById.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "api_keys_created_by_id_users_id_fk"
		}).onDelete("set null"),
	unique("api_keys_prefix_unique").on(table.prefix),
	unique("api_keys_key_hash_unique").on(table.keyHash),
]);

export const blogPosts = pgTable("blog_posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "blog_posts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	slug: text().notNull(),
	title: text().notNull(),
	excerpt: text(),
	heroImageUrl: text("hero_image_url"),
	category: text(),
	readMinutes: integer("read_minutes"),
	authorName: text("author_name"),
	authorRole: text("author_role"),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("blog_posts_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("blog_posts_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("blog_posts_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const adminInvites = pgTable("admin_invites", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_invites_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	email: text().notNull(),
	tokenHash: text("token_hash").notNull(),
	invitedByUserId: integer("invited_by_user_id").notNull(),
	role: userRole().default('VIEWER').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("admin_invites_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("admin_invites_invited_by_user_id_idx").using("btree", table.invitedByUserId.asc().nullsLast().op("int4_ops")),
	index("admin_invites_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invitedByUserId],
			foreignColumns: [users.id],
			name: "admin_invites_invited_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "password_reset_tokens_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("password_reset_tokens_expires_at_idx").using("btree", table.expiresAt.desc().nullsFirst().op("timestamptz_ops")),
	index("password_reset_tokens_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("password_reset_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const teams = pgTable("teams", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "teams_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("teams_slug_unique").on(table.slug),
]);

export const teamMembers = pgTable("team_members", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "team_members_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	teamId: integer("team_id").notNull(),
	userId: integer("user_id").notNull(),
	title: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("team_members_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("int4_ops")),
	index("team_members_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_members_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("team_members_team_user_unique").on(table.teamId, table.userId),
]);

export const cookieConsents = pgTable("cookie_consents", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "cookie_consents_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	visitorKey: text("visitor_key").notNull(),
	userId: integer("user_id"),
	preferences: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("cookie_consents_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("cookie_consents_visitor_key_idx").using("btree", table.visitorKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cookie_consents_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const bulkOrders = pgTable("bulk_orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "bulk_orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	orderReference: text("order_reference").notNull(),
	buyerCompanyName: text("buyer_company_name").notNull(),
	supplierId: integer("supplier_id").notNull(),
	supplierTier: supplierTier("supplier_tier").default('STANDARD').notNull(),
	totalMeters: numeric("total_meters", { precision: 14, scale:  2 }).notNull(),
	estimatedValueUsd: numeric("estimated_value_usd", { precision: 14, scale:  2 }),
	status: bulkOrderStatus().default('PROCESSING').notNull(),
	orderedAt: timestamp("ordered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("bulk_orders_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("bulk_orders_ordered_at_desc_idx").using("btree", table.orderedAt.asc().nullsLast().op("timestamptz_ops")),
	index("bulk_orders_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("bulk_orders_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "bulk_orders_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
	unique("bulk_orders_order_reference_unique").on(table.orderReference),
]);

export const buyerWishlistItems = pgTable("buyer_wishlist_items", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "buyer_wishlist_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	fabricId: integer("fabric_id").notNull(),
	collectionLabel: text("collection_label"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("buyer_wishlist_items_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("buyer_wishlist_items_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("buyer_wishlist_items_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "buyer_wishlist_items_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "buyer_wishlist_items_fabric_id_fabrics_id_fk"
		}).onDelete("cascade"),
	unique("buyer_wishlist_user_fabric_uq").on(table.userId, table.fabricId),
]);

export const commissionRules = pgTable("commission_rules", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "commission_rules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	categoryKey: text("category_key").notNull(),
	categoryLabel: text("category_label").notNull(),
	externalRef: text("external_ref"),
	baseCommissionPercent: numeric("base_commission_percent", { precision: 5, scale:  2 }).notNull(),
	minMonthlyVolumeUsd: integer("min_monthly_volume_usd").default(0).notNull(),
	tierMode: commissionTierMode("tier_mode").default('TIERED').notNull(),
	health: commissionHealth().default('HEALTHY').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	tiers: jsonb(),
	insightTitle: text("insight_title"),
	insightBody: text("insight_body"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("commission_rules_category_active_uq").using("btree", table.categoryKey.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("commission_rules_category_key_idx").using("btree", table.categoryKey.asc().nullsLast().op("text_ops")),
	index("commission_rules_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const supportKnowledgeCategories = pgTable("support_knowledge_categories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "support_knowledge_categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	title: text().notNull(),
	description: text().notNull(),
	iconKey: text("icon_key").notNull(),
	layout: supportKnowledgeCardLayout().default('WIDE').notNull(),
	highlights: jsonb().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("support_knowledge_categories_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("support_knowledge_categories_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const supportTroubleshootingEntries = pgTable("support_troubleshooting_entries", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "support_troubleshooting_entries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	code: text().notNull(),
	title: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("support_troubleshooting_entries_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("support_troubleshooting_entries_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const logisticsShipments = pgTable("logistics_shipments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "logistics_shipments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	trackingCode: text("tracking_code").notNull(),
	originCity: text("origin_city").notNull(),
	originCountry: text("origin_country").notNull(),
	supplierName: text("supplier_name").notNull(),
	supplierId: integer("supplier_id"),
	courierName: text("courier_name").notNull(),
	courierMode: logisticsCourierMode("courier_mode").default('AIR').notNull(),
	estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true, mode: 'string' }),
	deliveryStatusNote: text("delivery_status_note"),
	status: logisticsShipmentStatus().default('IN_TRANSIT').notNull(),
	corridorLabel: text("corridor_label"),
	activeCorridorTrucks: integer("active_corridor_trucks"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("logistics_shipments_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("logistics_shipments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("logistics_shipments_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "logistics_shipments_supplier_id_suppliers_id_fk"
		}).onDelete("set null"),
	unique("logistics_shipments_tracking_code_unique").on(table.trackingCode),
]);

export const internalSupportTickets = pgTable("internal_support_tickets", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "internal_support_tickets_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	submittedByUserId: integer("submitted_by_user_id").notNull(),
	serviceArea: supportTicketServiceArea("service_area").notNull(),
	urgency: supportTicketUrgency().default('NORMAL').notNull(),
	subject: text().notNull(),
	description: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("internal_support_tickets_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("internal_support_tickets_user_id_idx").using("btree", table.submittedByUserId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.submittedByUserId],
			foreignColumns: [users.id],
			name: "internal_support_tickets_submitted_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const adminAnnouncements = pgTable("admin_announcements", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_announcements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	title: text().notNull(),
	body: text().notNull(),
	importance: adminAnnouncementImportance().default('MEDIUM').notNull(),
	referenceCode: text("reference_code"),
	createdByUserId: integer("created_by_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("admin_announcements_created_by_user_id_idx").using("btree", table.createdByUserId.asc().nullsLast().op("int4_ops")),
	index("admin_announcements_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "admin_announcements_created_by_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const adminAnnouncementAcknowledgements = pgTable("admin_announcement_acknowledgements", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_announcement_acknowledgements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	announcementId: integer("announcement_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_announcement_acks_announcement_id_idx").using("btree", table.announcementId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("admin_announcement_acks_announcement_user_unique").using("btree", table.announcementId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	index("admin_announcement_acks_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.announcementId],
			foreignColumns: [adminAnnouncements.id],
			name: "admin_announcement_acknowledgements_announcement_id_admin_annou"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "admin_announcement_acknowledgements_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const fabrics = pgTable("fabrics", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabrics_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supplierId: integer("supplier_id").notNull(),
	slug: text().notNull(),
	sku: text(),
	status: fabricStatus().default('raw_scraped').notNull(),
	titleRu: text("title_ru").notNull(),
	titleEn: text("title_en"),
	descriptionRu: text("description_ru"),
	descriptionEn: text("description_en"),
	metaTitleRu: text("meta_title_ru"),
	metaDescriptionRu: text("meta_description_ru"),
	fabricType: text("fabric_type"),
	gsm: integer(),
	widthCm: integer("width_cm"),
	priceUsd: numeric("price_usd", { precision: 10, scale:  2 }),
	moq: integer(),
	composition: jsonb(),
	tags: text().array(),
	images: text().array(),
	sourceUrl: text("source_url"),
	rawTitle: text("raw_title"),
	rawDescription: text("raw_description"),
	aiConfidenceScore: numeric("ai_confidence_score", { precision: 3, scale:  2 }),
	aiProcessedAt: timestamp("ai_processed_at", { withTimezone: true, mode: 'string' }),
	isFeatured: boolean("is_featured").default(false).notNull(),
	socialScore: integer("social_score"),
	viewsCount: integer("views_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	metaTitleEn: text("meta_title_en"),
	metaDescriptionEn: text("meta_description_en"),
	imageAltRu: text("image_alt_ru"),
	imageAltEn: text("image_alt_en"),
	tagsEn: text("tags_en").array(),
	color: text(),
	supplyType: text("supply_type"),
	shipmentTime: text("shipment_time"),
	usageRu: text("usage_ru"),
	usageEn: text("usage_en"),
	colorEn: text("color_en"),
	supplyTypeEn: text("supply_type_en"),
	shipmentTimeEn: text("shipment_time_en"),
}, (table) => [
	index("fabrics_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("fabrics_social_score_desc_idx").using("btree", table.socialScore.desc().nullsFirst().op("int4_ops")),
	index("fabrics_status_deleted_at_idx").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.deletedAt.asc().nullsLast().op("enum_ops")),
	index("fabrics_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	index("fabrics_tags_gin_idx").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "fabrics_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
	unique("fabrics_slug_unique").on(table.slug),
]);

export const systemAlertMonitors = pgTable("system_alert_monitors", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_alert_monitors_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	monitorKey: text("monitor_key").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	enabled: boolean().default(true).notNull(),
	thresholdInt: integer("threshold_int"),
	accent: text().default('primary').notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("system_alert_monitors_enabled_idx").using("btree", table.enabled.asc().nullsLast().op("bool_ops")),
	uniqueIndex("system_alert_monitors_monitor_key_unique").using("btree", table.monitorKey.asc().nullsLast().op("text_ops")),
]);

export const systemAlertChannels = pgTable("system_alert_channels", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_alert_channels_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	channelKey: text("channel_key").notNull(),
	label: text().notNull(),
	subtitle: text().notNull(),
	enabled: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("system_alert_channels_channel_key_unique").using("btree", table.channelKey.asc().nullsLast().op("text_ops")),
	index("system_alert_channels_enabled_idx").using("btree", table.enabled.asc().nullsLast().op("bool_ops")),
]);

export const systemAlertPerformanceLogs = pgTable("system_alert_performance_logs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_alert_performance_logs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	monitorKey: text("monitor_key").notNull(),
	label: text().notNull(),
	workerHint: text("worker_hint").notNull(),
	avgLoadMs: integer("avg_load_ms").default(0).notNull(),
	status: text().notNull(),
	lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("system_alert_perf_logs_monitor_key_idx").using("btree", table.monitorKey.asc().nullsLast().op("text_ops")),
]);

export const supplierReviews = pgTable("supplier_reviews", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_reviews_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supplierId: integer("supplier_id").notNull(),
	fabricId: integer("fabric_id"),
	reviewerDisplayName: text("reviewer_display_name").notNull(),
	reviewerBadge: text("reviewer_badge"),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	rating: integer().notNull(),
	body: text().notNull(),
	skuSnapshot: text("sku_snapshot"),
	status: supplierReviewStatus().default('PENDING').notNull(),
	flagReason: text("flag_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("supplier_reviews_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("supplier_reviews_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("supplier_reviews_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_reviews_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "supplier_reviews_fabric_id_fabrics_id_fk"
		}).onDelete("set null"),
]);

export const supplierVerificationCases = pgTable("supplier_verification_cases", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_verification_cases_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supplierId: integer("supplier_id").notNull(),
	referenceCode: text("reference_code").notNull(),
	headline: text().notNull(),
	summary: text().notNull(),
	complianceScore: integer("compliance_score").default(0).notNull(),
	laborPct: integer("labor_pct").default(0).notNull(),
	envPct: integer("env_pct").default(0).notNull(),
	supplyPct: integer("supply_pct").default(0).notNull(),
	fiscalPct: integer("fiscal_pct").default(0).notNull(),
	status: supplierVerificationCaseStatus().default('IN_PROGRESS').notNull(),
	checklistJson: jsonb("checklist_json").default([]).notNull(),
	messagesJson: jsonb("messages_json").default([]).notNull(),
	facilityPhotoUrls: text("facility_photo_urls").array(),
	internalNote: text("internal_note"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("supplier_verification_cases_reference_code_unique").using("btree", table.referenceCode.asc().nullsLast().op("text_ops")),
	index("supplier_verification_cases_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_verification_cases_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
]);

export const supplierPayoutRequests = pgTable("supplier_payout_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_payout_requests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supplierId: integer("supplier_id").notNull(),
	requestedAmount: numeric("requested_amount", { precision: 14, scale:  2 }).notNull(),
	balanceSnapshot: numeric("balance_snapshot", { precision: 14, scale:  2 }).notNull(),
	bankLabel: text("bank_label").notNull(),
	accountMask: text("account_mask").notNull(),
	swiftCode: text("swift_code"),
	status: supplierPayoutStatus().default('PENDING').notNull(),
	resolutionNote: text("resolution_note"),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("supplier_payout_requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("supplier_payout_requests_supplier_id_idx").using("btree", table.supplierId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_payout_requests_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
]);

export const platformTaxRegions = pgTable("platform_tax_regions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "platform_tax_regions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	regionCode: text("region_code").notNull(),
	label: text().notNull(),
	description: text(),
	ratePercent: numeric("rate_percent", { precision: 8, scale:  4 }).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("platform_tax_regions_region_code_idx").using("btree", table.regionCode.asc().nullsLast().op("text_ops")),
]);

export const systemMaintenanceConfig = pgTable("system_maintenance_config", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_maintenance_config_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	isEnabled: boolean("is_enabled").default(false).notNull(),
	headline: text().default('Under Maintenance').notNull(),
	body: text().default('We are currently performing scheduled maintenance. Please check back soon.').notNull(),
	scheduledStart: timestamp("scheduled_start", { withTimezone: true, mode: 'string' }),
	scheduledEnd: timestamp("scheduled_end", { withTimezone: true, mode: 'string' }),
	migrationProgress: integer("migration_progress").default(0).notNull(),
	migrationStepsJson: jsonb("migration_steps_json").default([]).notNull(),
	systemIdLabel: text("system_id_label").default('MKT-OS-7712-B').notNull(),
	heroImageUrl: text("hero_image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const systemReleaseEntries = pgTable("system_release_entries", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_release_entries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	versionLabel: text("version_label").notNull(),
	title: text().notNull(),
	summary: text().notNull(),
	releaseKind: systemReleaseKind("release_kind").notNull(),
	releasedAt: timestamp("released_at", { withTimezone: true, mode: 'string' }).notNull(),
	highlightsJson: jsonb("highlights_json").default([]).notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("system_release_entries_released_at_idx").using("btree", table.releasedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const systemTechnicalLogs = pgTable("system_technical_logs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_technical_logs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	level: systemLogLevel().notNull(),
	serviceName: text("service_name").notNull(),
	message: text().notNull(),
	traceId: text("trace_id").notNull(),
	detailText: text("detail_text"),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("system_technical_logs_level_idx").using("btree", table.level.asc().nullsLast().op("enum_ops")),
	index("system_technical_logs_occurred_at_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const platformAppSettings = pgTable("platform_app_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "platform_app_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	siteName: text("site_name").default('TkanMarket Administrator').notNull(),
	supportEmail: text("support_email").default('ops@tkanmarket.com').notNull(),
	timezone: text().default('UTC').notNull(),
	twoFactorRequired: boolean("two_factor_required").default(true).notNull(),
	sessionTimeoutMinutes: integer("session_timeout_minutes").default(30).notNull(),
	ipWhitelistEnabled: boolean("ip_whitelist_enabled").default(false).notNull(),
	notificationMatrixJson: jsonb("notification_matrix_json").default([]).notNull(),
	updatedByUserId: integer("updated_by_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("platform_app_settings_updated_by_user_id_idx").using("btree", table.updatedByUserId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [users.id],
			name: "platform_app_settings_updated_by_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const systemIntegrations = pgTable("system_integrations", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_integrations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	slug: text().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	status: integrationStatus().default('INACTIVE').notNull(),
	externalRef: text("external_ref").notNull(),
	iconKey: text("icon_key").default('hub').notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("system_integrations_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const systemIntegrationHealthEvents = pgTable("system_integration_health_events", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "system_integration_health_events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	integrationId: integer("integration_id").notNull(),
	endpointPath: text("endpoint_path").notNull(),
	responseLabel: text("response_label").notNull(),
	healthDot: integrationHealthDot("health_dot").default('OK').notNull(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("system_integration_health_events_integration_id_idx").using("btree", table.integrationId.asc().nullsLast().op("int4_ops")),
	index("system_integration_health_events_occurred_at_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.integrationId],
			foreignColumns: [systemIntegrations.id],
			name: "system_integration_health_events_integration_id_system_integrat"
		}).onDelete("cascade"),
]);

export const platformRegionalPreferences = pgTable("platform_regional_preferences", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "platform_regional_preferences_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	primaryCurrency: text("primary_currency").default('USD').notNull(),
	skuPrefixPattern: text("sku_prefix_pattern").default('MKTP-{{CAT}}-{{YEAR}}').notNull(),
	skuSequenceLength: integer("sku_sequence_length").default(6).notNull(),
	updatedByUserId: integer("updated_by_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	platformTimezone: text("platform_timezone").default('UTC').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [users.id],
			name: "platform_regional_preferences_updated_by_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const wholesalePricingProfiles = pgTable("wholesale_pricing_profiles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "wholesale_pricing_profiles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fabricId: integer("fabric_id").notNull(),
	tiers: jsonb().default([]).notNull(),
	simBaseUnitCostUsd: numeric("sim_base_unit_cost_usd", { precision: 12, scale:  4 }),
	simMinTargetMarginPercent: numeric("sim_min_target_margin_percent", { precision: 6, scale:  2 }),
	simVolumeDecayFactor: numeric("sim_volume_decay_factor", { precision: 6, scale:  4 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("wholesale_pricing_profiles_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("wholesale_pricing_profiles_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("wholesale_pricing_profiles_fabric_id_uq").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "wholesale_pricing_profiles_fabric_id_fabrics_id_fk"
		}).onDelete("restrict"),
]);

export const catalogExportJobs = pgTable("catalog_export_jobs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "catalog_export_jobs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	jobName: text("job_name").notNull(),
	format: catalogExportFormat().default('CSV').notNull(),
	status: catalogExportStatus().default('PENDING').notNull(),
	recordCount: integer("record_count").default(0).notNull(),
	estimatedSizeBytes: integer("estimated_size_bytes").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("catalog_export_jobs_created_at_desc_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("catalog_export_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const logisticsCarriers = pgTable("logistics_carriers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "logistics_carriers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	carrierCode: text("carrier_code").notNull(),
	logoUrl: text("logo_url"),
	regionTag: text("region_tag"),
	serviceType: logisticsCarrierServiceType("service_type").default('EXPRESS').notNull(),
	health: logisticsCarrierHealth().default('OPERATIONAL').notNull(),
	reliabilityPercent: numeric("reliability_percent", { precision: 5, scale:  2 }).default('0').notNull(),
	avgTransitDays: numeric("avg_transit_days", { precision: 5, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("logistics_carriers_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("logistics_carriers_health_idx").using("btree", table.health.asc().nullsLast().op("enum_ops")),
	index("logistics_carriers_service_type_idx").using("btree", table.serviceType.asc().nullsLast().op("enum_ops")),
	unique("logistics_carriers_carrier_code_unique").on(table.carrierCode),
]);

export const logisticsCarrierLanes = pgTable("logistics_carrier_lanes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "logistics_carrier_lanes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	carrierId: integer("carrier_id").notNull(),
	laneCode: text("lane_code").notNull(),
	avgTransitDays: numeric("avg_transit_days", { precision: 5, scale:  2 }).default('0').notNull(),
	reliabilityPercent: numeric("reliability_percent", { precision: 5, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("logistics_carrier_lanes_carrier_id_idx").using("btree", table.carrierId.asc().nullsLast().op("int4_ops")),
	index("logistics_carrier_lanes_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("logistics_carrier_lanes_lane_code_idx").using("btree", table.laneCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.carrierId],
			foreignColumns: [logisticsCarriers.id],
			name: "logistics_carrier_lanes_carrier_id_logistics_carriers_id_fk"
		}).onDelete("restrict"),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "newsletter_subscribers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	email: text().notNull(),
	locale: text().default('en').notNull(),
	source: text().default('blog').notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("newsletter_subscribers_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("newsletter_subscribers_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("newsletter_subscribers_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("newsletter_subscribers_email_unique_active").using("btree", sql`lower(email)`).where(sql`(deleted_at IS NULL)`),
]);

export const supplierDiscoveryRuns = pgTable("supplier_discovery_runs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_discovery_runs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	status: supplierDiscoveryRunStatus().default('PENDING').notNull(),
	sources: text().array().notNull(),
	criteriaJson: jsonb("criteria_json").notNull(),
	keywords: text().array().notNull(),
	maxSuppliers: integer("max_suppliers").default(50).notNull(),
	maxProductsPerSupplier: integer("max_products_per_supplier").default(10).notNull(),
	suppliersFound: integer("suppliers_found").default(0).notNull(),
	suppliersQualified: integer("suppliers_qualified").default(0).notNull(),
	productsExtracted: integer("products_extracted").default(0).notNull(),
	draftsReady: integer("drafts_ready").default(0).notNull(),
	triggeredById: integer("triggered_by_id"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	errorLog: text("error_log"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	runNote: text("run_note"),
}, (table) => [
	index("supplier_discovery_runs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("supplier_discovery_runs_triggered_by_id_idx").using("btree", table.triggeredById.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.triggeredById],
			foreignColumns: [users.id],
			name: "supplier_discovery_runs_triggered_by_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const supplierDiscoverySuppliers = pgTable("supplier_discovery_suppliers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_discovery_suppliers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	runId: integer("run_id").notNull(),
	source: text().notNull(),
	supplierUrl: text("supplier_url").notNull(),
	supplierUrlHash: text("supplier_url_hash").notNull(),
	name: text(),
	logoUrl: text("logo_url"),
	websiteUrl: text("website_url"),
	establishedYear: integer("established_year"),
	city: text(),
	province: text(),
	country: text(),
	yearsInBusiness: integer("years_in_business"),
	catalogSizeEstimate: integer("catalog_size_estimate"),
	moqMinMeters: integer("moq_min_meters"),
	photosScore: numeric("photos_score", { precision: 5, scale:  2 }),
	qualified: boolean().default(false).notNull(),
	qualificationReasons: text("qualification_reasons").array(),
	status: supplierDiscoverySupplierStatus().default('NEW').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("supplier_discovery_suppliers_qualified_idx").using("btree", table.qualified.asc().nullsLast().op("bool_ops")),
	uniqueIndex("supplier_discovery_suppliers_run_id_hash_uq").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.supplierUrlHash.asc().nullsLast().op("int4_ops")),
	index("supplier_discovery_suppliers_run_id_idx").using("btree", table.runId.asc().nullsLast().op("int4_ops")),
	index("supplier_discovery_suppliers_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [supplierDiscoveryRuns.id],
			name: "supplier_discovery_suppliers_run_id_supplier_discovery_runs_id_"
		}).onDelete("restrict"),
]);

export const supplierDiscoveryProducts = pgTable("supplier_discovery_products", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_discovery_products_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	runId: integer("run_id").notNull(),
	discoverySupplierId: integer("discovery_supplier_id").notNull(),
	productUrl: text("product_url").notNull(),
	urlHash: text("url_hash").notNull(),
	rawTitle: text("raw_title").notNull(),
	rawDescription: text("raw_description"),
	rawImages: text("raw_images").array(),
	priceText: text("price_text"),
	moqText: text("moq_text"),
	moqMeters: integer("moq_meters"),
	compositionText: text("composition_text"),
	gsmText: text("gsm_text"),
	widthText: text("width_text"),
	photoCount: integer("photo_count").default(0).notNull(),
	photoQualityScore: numeric("photo_quality_score", { precision: 5, scale:  2 }),
	status: supplierDiscoveryProductStatus().default('NEW').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("supplier_discovery_products_discovery_supplier_id_idx").using("btree", table.discoverySupplierId.asc().nullsLast().op("int4_ops")),
	index("supplier_discovery_products_run_id_idx").using("btree", table.runId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("supplier_discovery_products_run_id_url_hash_uq").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.urlHash.asc().nullsLast().op("int4_ops")),
	index("supplier_discovery_products_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [supplierDiscoveryRuns.id],
			name: "supplier_discovery_products_run_id_supplier_discovery_runs_id_f"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.discoverySupplierId],
			foreignColumns: [supplierDiscoverySuppliers.id],
			name: "supplier_discovery_products_discovery_supplier_id_supplier_disc"
		}).onDelete("restrict"),
]);

export const fabricCategoryTerms = pgTable("fabric_category_terms", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_category_terms_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	slug: text().notNull(),
	nameRu: text("name_ru").notNull(),
	nameEn: text("name_en"),
	descriptionRu: text("description_ru"),
	descriptionEn: text("description_en"),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("fabric_category_terms_active_deleted_idx").using("btree", table.isActive.asc().nullsLast().op("timestamptz_ops"), table.deletedAt.asc().nullsLast().op("bool_ops")),
	index("fabric_category_terms_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("fabric_category_terms_slug_uq").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("fabric_category_terms_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const socialCampaigns = pgTable("social_campaigns", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_campaigns_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	description: text(),
	status: socialCampaignStatus().default('PLANNING').notNull(),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	createdByUserId: integer("created_by_user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("social_campaigns_created_by_idx").using("btree", table.createdByUserId.asc().nullsLast().op("int4_ops")),
	index("social_campaigns_starts_at_idx").using("btree", table.startsAt.asc().nullsLast().op("timestamptz_ops")),
	index("social_campaigns_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.deletedAt.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "social_campaigns_created_by_user_id_fk"
		}).onDelete("restrict"),
]);

export const socialPlatformCredentials = pgTable("social_platform_credentials", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_platform_credentials_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	platform: socialPlatform().notNull(),
	accountId: text("account_id").notNull(),
	accountName: text("account_name"),
	accountUsername: text("account_username"),
	avatarUrl: text("avatar_url"),
	accessTokenEncrypted: text("access_token_encrypted").notNull(),
	refreshTokenEncrypted: text("refresh_token_encrypted"),
	tokenType: text("token_type"),
	scopes: text().array(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true, mode: 'string' }),
	refreshFailureCount: integer("refresh_failure_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("social_platform_credentials_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("social_platform_credentials_platform_active_idx").using("btree", table.platform.asc().nullsLast().op("timestamptz_ops"), table.isActive.asc().nullsLast().op("timestamptz_ops"), table.deletedAt.asc().nullsLast().op("bool_ops")),
	index("social_platform_credentials_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "social_platform_credentials_user_id_fk"
		}).onDelete("cascade"),
	unique("social_platform_credentials_user_platform_account_uq").on(table.userId, table.platform, table.accountId),
]);

export const socialOauthStates = pgTable("social_oauth_states", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_oauth_states_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	state: text().notNull(),
	codeVerifier: text("code_verifier"),
	userId: integer("user_id").notNull(),
	platform: socialPlatform().notNull(),
	redirectUri: text("redirect_uri").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	consumedAt: timestamp("consumed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_oauth_states_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("social_oauth_states_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "social_oauth_states_user_id_fk"
		}).onDelete("cascade"),
	unique("social_oauth_states_state_key").on(table.state),
]);

export const socialPostAnalyticsHistory = pgTable("social_post_analytics_history", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_post_analytics_history_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	reach: integer(),
	impressions: integer(),
	likes: integer(),
	comments: integer(),
	shares: integer(),
	saves: integer(),
	linkClicks: integer("link_clicks"),
	videoViews: integer("video_views"),
	rawPayload: jsonb("raw_payload"),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_post_analytics_history_post_idx").using("btree", table.postId.asc().nullsLast().op("int4_ops"), table.capturedAt.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [socialPosts.id],
			name: "social_post_analytics_history_post_id_fk"
		}).onDelete("cascade"),
]);

export const socialActivityLog = pgTable("social_activity_log", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_activity_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id"),
	credentialId: integer("credential_id"),
	campaignId: integer("campaign_id"),
	action: socialActivityAction().notNull(),
	actorUserId: integer("actor_user_id"),
	details: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_activity_log_actor_idx").using("btree", table.actorUserId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("social_activity_log_campaign_idx").using("btree", table.campaignId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("int4_ops")),
	index("social_activity_log_post_idx").using("btree", table.postId.asc().nullsLast().op("int4_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [socialPosts.id],
			name: "social_activity_log_post_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.credentialId],
			foreignColumns: [socialPlatformCredentials.id],
			name: "social_activity_log_credential_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [socialCampaigns.id],
			name: "social_activity_log_campaign_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.actorUserId],
			foreignColumns: [users.id],
			name: "social_activity_log_actor_user_id_fk"
		}).onDelete("set null"),
]);

export const fabricTypes = pgTable("fabric_types", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_types_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	slug: text().notNull(),
	labelRu: text("label_ru").notNull(),
	labelEn: text("label_en"),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("fabric_types_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("fabric_types_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("fabric_types_slug_unique").on(table.slug),
]);

export const socialPosts = pgTable("social_posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "social_posts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fabricId: integer("fabric_id").notNull(),
	platform: socialPlatform().notNull(),
	contentType: socialContentType("content_type").notNull(),
	status: socialPostStatus().default('DRAFT').notNull(),
	captionText: text("caption_text"),
	hashtags: text().array(),
	scriptText: text("script_text"),
	mediaUrls: text("media_urls").array(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	platformPostId: text("platform_post_id"),
	reach: integer(),
	likes: integer(),
	shares: integer(),
	linkClicks: integer("link_clicks"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	campaignId: integer("campaign_id"),
	platformMediaVariants: jsonb("platform_media_variants"),
	platformMetadata: jsonb("platform_metadata"),
	platformPostUrl: text("platform_post_url"),
	impressions: integer(),
	comments: integer(),
	saves: integer(),
	videoViews: integer("video_views"),
	analyticsSyncedAt: timestamp("analytics_synced_at", { withTimezone: true, mode: 'string' }),
	publishAttempts: integer("publish_attempts").default(0).notNull(),
	lastPublishErrorAt: timestamp("last_publish_error_at", { withTimezone: true, mode: 'string' }),
	approvedByUserId: integer("approved_by_user_id"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	scheduledByUserId: integer("scheduled_by_user_id"),
	publishedByUserId: integer("published_by_user_id"),
}, (table) => [
	index("social_posts_analytics_synced_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamptz_ops"), table.analyticsSyncedAt.asc().nullsLast().op("timestamptz_ops")),
	index("social_posts_approved_by_idx").using("btree", table.approvedByUserId.asc().nullsLast().op("int4_ops")),
	index("social_posts_campaign_id_idx").using("btree", table.campaignId.asc().nullsLast().op("int4_ops")),
	index("social_posts_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("social_posts_platform_status_idx").using("btree", table.platform.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("social_posts_published_by_idx").using("btree", table.publishedByUserId.asc().nullsLast().op("int4_ops")),
	index("social_posts_scheduled_by_idx").using("btree", table.scheduledByUserId.asc().nullsLast().op("int4_ops")),
	index("social_posts_status_scheduled_at_idx").using("btree", table.status.asc().nullsLast().op("timestamptz_ops"), table.scheduledAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("social_posts_active_uq").using("btree", table.fabricId.asc().nullsLast().op("int4_ops"), table.platform.asc().nullsLast().op("enum_ops")).where(sql`"social_posts"."status" <> 'PUBLISHED' AND "social_posts"."deleted_at" IS NULL`),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "social_posts_fabric_id_fabrics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [socialCampaigns.id],
			name: "social_posts_campaign_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approvedByUserId],
			foreignColumns: [users.id],
			name: "social_posts_approved_by_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.scheduledByUserId],
			foreignColumns: [users.id],
			name: "social_posts_scheduled_by_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.publishedByUserId],
			foreignColumns: [users.id],
			name: "social_posts_published_by_user_id_fk"
		}).onDelete("set null"),
]);

export const generatedMedia = pgTable("generated_media", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "generated_media_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fabricId: integer("fabric_id").notNull(),
	socialPostId: integer("social_post_id"),
	type: text().notNull(),
	mediaType: text("media_type"),
	url: text(),
	thumbnailUrl: text("thumbnail_url"),
	prompt: text().notNull(),
	provider: text().default('gemini').notNull(),
	providerModel: text("provider_model"),
	providerJobId: text("provider_job_id"),
	status: text().default('PENDING').notNull(),
	supersededByMediaId: integer("superseded_by_media_id"),
	durationSeconds: integer("duration_seconds"),
	aspectRatio: text("aspect_ratio"),
	fileSizeBytes: integer("file_size_bytes"),
	errorMessage: text("error_message"),
	adminReviewedAt: timestamp("admin_reviewed_at", { withTimezone: true, mode: 'string' }),
	adminReviewerId: integer("admin_reviewer_id"),
	adminReviewNotes: text("admin_review_notes"),
	metadata: jsonb(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("generated_media_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("generated_media_social_post_id_idx").using("btree", table.socialPostId.asc().nullsLast().op("int4_ops")),
	index("generated_media_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("generated_media_superseded_by_idx").using("btree", table.supersededByMediaId.asc().nullsLast().op("int4_ops")),
	index("generated_media_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "generated_media_fabric_id_fabrics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.adminReviewerId],
			foreignColumns: [users.id],
			name: "generated_media_admin_reviewer_id_users_id_fk"
		}).onDelete("set null"),
]);

export const bulkImportJobs = pgTable("bulk_import_jobs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "bulk_import_jobs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supplierId: integer("supplier_id").notNull(),
	filename: text().notNull(),
	totalRows: integer("total_rows").default(0).notNull(),
	successCount: integer("success_count").default(0).notNull(),
	errorCount: integer("error_count").default(0).notNull(),
	status: bulkImportJobStatus().default('PENDING').notNull(),
	errors: jsonb(),
	createdById: integer("created_by_id"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "bulk_import_jobs_supplier_id_suppliers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "bulk_import_jobs_created_by_id_users_id_fk"
		}),
]);

export const fabricPromptRules = pgTable("fabric_prompt_rules", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_prompt_rules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	description: text(),
	priority: integer().default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	conditions: jsonb().default([]).notNull(),
	imagePrompts: jsonb("image_prompts").default([]).notNull(),
	videoPrompt: text("video_prompt"),
	videoPromptEnabled: boolean("video_prompt_enabled").default(true).notNull(),
	videoDurationSeconds: integer("video_duration_seconds").default(8),
	videoAspectRatio: text("video_aspect_ratio").default('9:16'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("fabric_prompt_rules_active_priority_idx").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.priority.asc().nullsLast().op("int4_ops")),
	index("fabric_prompt_rules_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const fabricTextPromptRules = pgTable("fabric_text_prompt_rules", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "fabric_text_prompt_rules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	description: text(),
	priority: integer().default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	conditions: jsonb().default([]).notNull(),
	enrichmentSystemPrompt: text("enrichment_system_prompt"),
	enrichmentUserTemplate: text("enrichment_user_template"),
	translationSystemPrompt: text("translation_system_prompt"),
	translationUserTemplate: text("translation_user_template"),
	socialSystemPrompt: text("social_system_prompt"),
	socialUserTemplate: text("social_user_template"),
	blogSystemPrompt: text("blog_system_prompt"),
	blogUserTemplate: text("blog_user_template"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("fabric_text_rules_active_priority_idx").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.priority.asc().nullsLast().op("int4_ops")),
	index("fabric_text_rules_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const adminRawUploads = pgTable("admin_raw_uploads", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_raw_uploads_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	filename: text().notNull(),
	originalFileUrl: text("original_file_url"),
	fileType: text("file_type").notNull(),
	status: adminRawUploadStatus().default('PENDING').notNull(),
	totalRows: integer("total_rows").default(0).notNull(),
	processedRows: integer("processed_rows").default(0).notNull(),
	errorRows: integer("error_rows").default(0).notNull(),
	uploadedByUserId: integer("uploaded_by_user_id").notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("admin_raw_uploads_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("admin_raw_uploads_user_idx").using("btree", table.uploadedByUserId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.uploadedByUserId],
			foreignColumns: [users.id],
			name: "admin_raw_uploads_uploaded_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const adminRawUploadRows = pgTable("admin_raw_upload_rows", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_raw_upload_rows_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	uploadId: integer("upload_id").notNull(),
	rowIndex: integer("row_index").notNull(),
	rawData: jsonb("raw_data").notNull(),
	normalizedData: jsonb("normalized_data"),
	status: adminRawUploadRowStatus().default('PENDING').notNull(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("admin_raw_upload_rows_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("admin_raw_upload_rows_upload_idx").using("btree", table.uploadId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.uploadId],
			foreignColumns: [adminRawUploads.id],
			name: "admin_raw_upload_rows_upload_id_admin_raw_uploads_id_fk"
		}).onDelete("restrict"),
]);

export const adminRawProcessingLog = pgTable("admin_raw_processing_log", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "admin_raw_processing_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	uploadId: integer("upload_id").notNull(),
	rowId: integer("row_id").notNull(),
	fabricId: integer("fabric_id"),
	status: adminRawProcessingStatus().default('PENDING').notNull(),
	aiConfidenceScore: text("ai_confidence_score"),
	aiProcessedAt: timestamp("ai_processed_at", { withTimezone: true, mode: 'string' }),
	aiStatus: text("ai_status"),
	errorMessage: text("error_message"),
	retriesCount: integer("retries_count").default(0).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("admin_raw_processing_log_fabric_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("admin_raw_processing_log_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("admin_raw_processing_log_upload_idx").using("btree", table.uploadId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.uploadId],
			foreignColumns: [adminRawUploads.id],
			name: "admin_raw_processing_log_upload_id_admin_raw_uploads_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.rowId],
			foreignColumns: [adminRawUploadRows.id],
			name: "admin_raw_processing_log_row_id_admin_raw_upload_rows_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "admin_raw_processing_log_fabric_id_fabrics_id_fk"
		}).onDelete("set null"),
]);

export const aiPromptLogs = pgTable("ai_prompt_logs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "ai_prompt_logs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	source: text().notNull(),
	fabricId: integer("fabric_id"),
	model: text().notNull(),
	prompt: text().notNull(),
	systemPrompt: text("system_prompt"),
	responseText: text("response_text"),
	imageCount: integer("image_count"),
	videoCount: integer("video_count"),
	status: text().default('success').notNull(),
	errorMessage: text("error_message"),
	durationMs: integer("duration_ms"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	actorId: integer("actor_id"),
	promptTokenCount: integer("prompt_token_count"),
	candidatesTokenCount: integer("candidates_token_count"),
	totalTokenCount: integer("total_token_count"),
	costUsd: numeric("cost_usd", { precision: 10, scale:  6 }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("ai_prompt_logs_actor_idx").using("btree", table.actorId.asc().nullsLast().op("int4_ops")),
	index("ai_prompt_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ai_prompt_logs_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
	index("ai_prompt_logs_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.fabricId],
			foreignColumns: [fabrics.id],
			name: "ai_prompt_logs_fabric_id_fabrics_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "ai_prompt_logs_actor_id_users_id_fk"
		}).onDelete("set null"),
]);
