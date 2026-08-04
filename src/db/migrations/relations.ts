import { relations } from "drizzle-orm/relations";
import { fabrics, fabricCategories, fabricActivityLog, users, leads, leadActivityLog, crawlerRuns, leadNotes, roles, rolePermissions, permissions, userRoles, auditLog, authSecurityEvents, notificationSettings, notifications, apiKeys, adminInvites, passwordResetTokens, teams, teamMembers, cookieConsents, suppliers, bulkOrders, buyerWishlistItems, logisticsShipments, internalSupportTickets, adminAnnouncements, adminAnnouncementAcknowledgements, supplierReviews, supplierVerificationCases, supplierPayoutRequests, platformAppSettings, systemIntegrations, systemIntegrationHealthEvents, platformRegionalPreferences, wholesalePricingProfiles, logisticsCarriers, logisticsCarrierLanes, supplierDiscoveryRuns, supplierDiscoverySuppliers, supplierDiscoveryProducts, socialCampaigns, socialPlatformCredentials, socialOauthStates, socialPosts, socialPostAnalyticsHistory, socialActivityLog, generatedMedia, bulkImportJobs, adminRawUploads, adminRawUploadRows, adminRawProcessingLog, aiPromptLogs } from "./schema";

export const fabricCategoriesRelations = relations(fabricCategories, ({one}) => ({
	fabric: one(fabrics, {
		fields: [fabricCategories.fabricId],
		references: [fabrics.id]
	}),
}));

export const fabricsRelations = relations(fabrics, ({one, many}) => ({
	fabricCategories: many(fabricCategories),
	fabricActivityLogs: many(fabricActivityLog),
	leads: many(leads),
	buyerWishlistItems: many(buyerWishlistItems),
	supplier: one(suppliers, {
		fields: [fabrics.supplierId],
		references: [suppliers.id]
	}),
	supplierReviews: many(supplierReviews),
	wholesalePricingProfiles: many(wholesalePricingProfiles),
	socialPosts: many(socialPosts),
	generatedMedias: many(generatedMedia),
	adminRawProcessingLogs: many(adminRawProcessingLog),
	aiPromptLogs: many(aiPromptLogs),
}));

export const fabricActivityLogRelations = relations(fabricActivityLog, ({one}) => ({
	fabric: one(fabrics, {
		fields: [fabricActivityLog.fabricId],
		references: [fabrics.id]
	}),
	user: one(users, {
		fields: [fabricActivityLog.actorId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	fabricActivityLogs: many(fabricActivityLog),
	leads: many(leads),
	leadActivityLogs: many(leadActivityLog),
	crawlerRuns: many(crawlerRuns),
	leadNotes: many(leadNotes),
	userRoles: many(userRoles),
	auditLogs: many(auditLog),
	authSecurityEvents: many(authSecurityEvents),
	notificationSettings: many(notificationSettings),
	notifications: many(notifications),
	apiKeys: many(apiKeys),
	adminInvites: many(adminInvites),
	passwordResetTokens: many(passwordResetTokens),
	teamMembers: many(teamMembers),
	cookieConsents: many(cookieConsents),
	buyerWishlistItems: many(buyerWishlistItems),
	internalSupportTickets: many(internalSupportTickets),
	adminAnnouncements: many(adminAnnouncements),
	adminAnnouncementAcknowledgements: many(adminAnnouncementAcknowledgements),
	platformAppSettings: many(platformAppSettings),
	platformRegionalPreferences: many(platformRegionalPreferences),
	supplierDiscoveryRuns: many(supplierDiscoveryRuns),
	socialCampaigns: many(socialCampaigns),
	socialPlatformCredentials: many(socialPlatformCredentials),
	socialOauthStates: many(socialOauthStates),
	socialActivityLogs: many(socialActivityLog),
	socialPosts_approvedByUserId: many(socialPosts, {
		relationName: "socialPosts_approvedByUserId_users_id"
	}),
	socialPosts_scheduledByUserId: many(socialPosts, {
		relationName: "socialPosts_scheduledByUserId_users_id"
	}),
	socialPosts_publishedByUserId: many(socialPosts, {
		relationName: "socialPosts_publishedByUserId_users_id"
	}),
	generatedMedias: many(generatedMedia),
	bulkImportJobs: many(bulkImportJobs),
	adminRawUploads: many(adminRawUploads),
	aiPromptLogs: many(aiPromptLogs),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	fabric: one(fabrics, {
		fields: [leads.fabricId],
		references: [fabrics.id]
	}),
	user: one(users, {
		fields: [leads.assignedToId],
		references: [users.id]
	}),
	leadActivityLogs: many(leadActivityLog),
	leadNotes: many(leadNotes),
}));

export const leadActivityLogRelations = relations(leadActivityLog, ({one}) => ({
	lead: one(leads, {
		fields: [leadActivityLog.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadActivityLog.actorId],
		references: [users.id]
	}),
}));

export const crawlerRunsRelations = relations(crawlerRuns, ({one}) => ({
	user: one(users, {
		fields: [crawlerRuns.triggeredById],
		references: [users.id]
	}),
}));

export const leadNotesRelations = relations(leadNotes, ({one}) => ({
	lead: one(leads, {
		fields: [leadNotes.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadNotes.authorId],
		references: [users.id]
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePermissions: many(rolePermissions),
	userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(users, {
		fields: [auditLog.actorId],
		references: [users.id]
	}),
}));

export const authSecurityEventsRelations = relations(authSecurityEvents, ({one}) => ({
	user: one(users, {
		fields: [authSecurityEvents.userId],
		references: [users.id]
	}),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({one}) => ({
	user: one(users, {
		fields: [notificationSettings.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.createdById],
		references: [users.id]
	}),
}));

export const adminInvitesRelations = relations(adminInvites, ({one}) => ({
	user: one(users, {
		fields: [adminInvites.invitedByUserId],
		references: [users.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	teamMembers: many(teamMembers),
}));

export const cookieConsentsRelations = relations(cookieConsents, ({one}) => ({
	user: one(users, {
		fields: [cookieConsents.userId],
		references: [users.id]
	}),
}));

export const bulkOrdersRelations = relations(bulkOrders, ({one}) => ({
	supplier: one(suppliers, {
		fields: [bulkOrders.supplierId],
		references: [suppliers.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	bulkOrders: many(bulkOrders),
	logisticsShipments: many(logisticsShipments),
	fabrics: many(fabrics),
	supplierReviews: many(supplierReviews),
	supplierVerificationCases: many(supplierVerificationCases),
	supplierPayoutRequests: many(supplierPayoutRequests),
	bulkImportJobs: many(bulkImportJobs),
}));

export const buyerWishlistItemsRelations = relations(buyerWishlistItems, ({one}) => ({
	user: one(users, {
		fields: [buyerWishlistItems.userId],
		references: [users.id]
	}),
	fabric: one(fabrics, {
		fields: [buyerWishlistItems.fabricId],
		references: [fabrics.id]
	}),
}));

export const logisticsShipmentsRelations = relations(logisticsShipments, ({one}) => ({
	supplier: one(suppliers, {
		fields: [logisticsShipments.supplierId],
		references: [suppliers.id]
	}),
}));

export const internalSupportTicketsRelations = relations(internalSupportTickets, ({one}) => ({
	user: one(users, {
		fields: [internalSupportTickets.submittedByUserId],
		references: [users.id]
	}),
}));

export const adminAnnouncementsRelations = relations(adminAnnouncements, ({one, many}) => ({
	user: one(users, {
		fields: [adminAnnouncements.createdByUserId],
		references: [users.id]
	}),
	adminAnnouncementAcknowledgements: many(adminAnnouncementAcknowledgements),
}));

export const adminAnnouncementAcknowledgementsRelations = relations(adminAnnouncementAcknowledgements, ({one}) => ({
	adminAnnouncement: one(adminAnnouncements, {
		fields: [adminAnnouncementAcknowledgements.announcementId],
		references: [adminAnnouncements.id]
	}),
	user: one(users, {
		fields: [adminAnnouncementAcknowledgements.userId],
		references: [users.id]
	}),
}));

export const supplierReviewsRelations = relations(supplierReviews, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierReviews.supplierId],
		references: [suppliers.id]
	}),
	fabric: one(fabrics, {
		fields: [supplierReviews.fabricId],
		references: [fabrics.id]
	}),
}));

export const supplierVerificationCasesRelations = relations(supplierVerificationCases, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierVerificationCases.supplierId],
		references: [suppliers.id]
	}),
}));

export const supplierPayoutRequestsRelations = relations(supplierPayoutRequests, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierPayoutRequests.supplierId],
		references: [suppliers.id]
	}),
}));

export const platformAppSettingsRelations = relations(platformAppSettings, ({one}) => ({
	user: one(users, {
		fields: [platformAppSettings.updatedByUserId],
		references: [users.id]
	}),
}));

export const systemIntegrationHealthEventsRelations = relations(systemIntegrationHealthEvents, ({one}) => ({
	systemIntegration: one(systemIntegrations, {
		fields: [systemIntegrationHealthEvents.integrationId],
		references: [systemIntegrations.id]
	}),
}));

export const systemIntegrationsRelations = relations(systemIntegrations, ({many}) => ({
	systemIntegrationHealthEvents: many(systemIntegrationHealthEvents),
}));

export const platformRegionalPreferencesRelations = relations(platformRegionalPreferences, ({one}) => ({
	user: one(users, {
		fields: [platformRegionalPreferences.updatedByUserId],
		references: [users.id]
	}),
}));

export const wholesalePricingProfilesRelations = relations(wholesalePricingProfiles, ({one}) => ({
	fabric: one(fabrics, {
		fields: [wholesalePricingProfiles.fabricId],
		references: [fabrics.id]
	}),
}));

export const logisticsCarrierLanesRelations = relations(logisticsCarrierLanes, ({one}) => ({
	logisticsCarrier: one(logisticsCarriers, {
		fields: [logisticsCarrierLanes.carrierId],
		references: [logisticsCarriers.id]
	}),
}));

export const logisticsCarriersRelations = relations(logisticsCarriers, ({many}) => ({
	logisticsCarrierLanes: many(logisticsCarrierLanes),
}));

export const supplierDiscoveryRunsRelations = relations(supplierDiscoveryRuns, ({one, many}) => ({
	user: one(users, {
		fields: [supplierDiscoveryRuns.triggeredById],
		references: [users.id]
	}),
	supplierDiscoverySuppliers: many(supplierDiscoverySuppliers),
	supplierDiscoveryProducts: many(supplierDiscoveryProducts),
}));

export const supplierDiscoverySuppliersRelations = relations(supplierDiscoverySuppliers, ({one, many}) => ({
	supplierDiscoveryRun: one(supplierDiscoveryRuns, {
		fields: [supplierDiscoverySuppliers.runId],
		references: [supplierDiscoveryRuns.id]
	}),
	supplierDiscoveryProducts: many(supplierDiscoveryProducts),
}));

export const supplierDiscoveryProductsRelations = relations(supplierDiscoveryProducts, ({one}) => ({
	supplierDiscoveryRun: one(supplierDiscoveryRuns, {
		fields: [supplierDiscoveryProducts.runId],
		references: [supplierDiscoveryRuns.id]
	}),
	supplierDiscoverySupplier: one(supplierDiscoverySuppliers, {
		fields: [supplierDiscoveryProducts.discoverySupplierId],
		references: [supplierDiscoverySuppliers.id]
	}),
}));

export const socialCampaignsRelations = relations(socialCampaigns, ({one, many}) => ({
	user: one(users, {
		fields: [socialCampaigns.createdByUserId],
		references: [users.id]
	}),
	socialActivityLogs: many(socialActivityLog),
	socialPosts: many(socialPosts),
}));

export const socialPlatformCredentialsRelations = relations(socialPlatformCredentials, ({one, many}) => ({
	user: one(users, {
		fields: [socialPlatformCredentials.userId],
		references: [users.id]
	}),
	socialActivityLogs: many(socialActivityLog),
}));

export const socialOauthStatesRelations = relations(socialOauthStates, ({one}) => ({
	user: one(users, {
		fields: [socialOauthStates.userId],
		references: [users.id]
	}),
}));

export const socialPostAnalyticsHistoryRelations = relations(socialPostAnalyticsHistory, ({one}) => ({
	socialPost: one(socialPosts, {
		fields: [socialPostAnalyticsHistory.postId],
		references: [socialPosts.id]
	}),
}));

export const socialPostsRelations = relations(socialPosts, ({one, many}) => ({
	socialPostAnalyticsHistories: many(socialPostAnalyticsHistory),
	socialActivityLogs: many(socialActivityLog),
	fabric: one(fabrics, {
		fields: [socialPosts.fabricId],
		references: [fabrics.id]
	}),
	socialCampaign: one(socialCampaigns, {
		fields: [socialPosts.campaignId],
		references: [socialCampaigns.id]
	}),
	user_approvedByUserId: one(users, {
		fields: [socialPosts.approvedByUserId],
		references: [users.id],
		relationName: "socialPosts_approvedByUserId_users_id"
	}),
	user_scheduledByUserId: one(users, {
		fields: [socialPosts.scheduledByUserId],
		references: [users.id],
		relationName: "socialPosts_scheduledByUserId_users_id"
	}),
	user_publishedByUserId: one(users, {
		fields: [socialPosts.publishedByUserId],
		references: [users.id],
		relationName: "socialPosts_publishedByUserId_users_id"
	}),
}));

export const socialActivityLogRelations = relations(socialActivityLog, ({one}) => ({
	socialPost: one(socialPosts, {
		fields: [socialActivityLog.postId],
		references: [socialPosts.id]
	}),
	socialPlatformCredential: one(socialPlatformCredentials, {
		fields: [socialActivityLog.credentialId],
		references: [socialPlatformCredentials.id]
	}),
	socialCampaign: one(socialCampaigns, {
		fields: [socialActivityLog.campaignId],
		references: [socialCampaigns.id]
	}),
	user: one(users, {
		fields: [socialActivityLog.actorUserId],
		references: [users.id]
	}),
}));

export const generatedMediaRelations = relations(generatedMedia, ({one}) => ({
	fabric: one(fabrics, {
		fields: [generatedMedia.fabricId],
		references: [fabrics.id]
	}),
	user: one(users, {
		fields: [generatedMedia.adminReviewerId],
		references: [users.id]
	}),
}));

export const bulkImportJobsRelations = relations(bulkImportJobs, ({one}) => ({
	supplier: one(suppliers, {
		fields: [bulkImportJobs.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [bulkImportJobs.createdById],
		references: [users.id]
	}),
}));

export const adminRawUploadsRelations = relations(adminRawUploads, ({one, many}) => ({
	user: one(users, {
		fields: [adminRawUploads.uploadedByUserId],
		references: [users.id]
	}),
	adminRawUploadRows: many(adminRawUploadRows),
	adminRawProcessingLogs: many(adminRawProcessingLog),
}));

export const adminRawUploadRowsRelations = relations(adminRawUploadRows, ({one, many}) => ({
	adminRawUpload: one(adminRawUploads, {
		fields: [adminRawUploadRows.uploadId],
		references: [adminRawUploads.id]
	}),
	adminRawProcessingLogs: many(adminRawProcessingLog),
}));

export const adminRawProcessingLogRelations = relations(adminRawProcessingLog, ({one}) => ({
	adminRawUpload: one(adminRawUploads, {
		fields: [adminRawProcessingLog.uploadId],
		references: [adminRawUploads.id]
	}),
	adminRawUploadRow: one(adminRawUploadRows, {
		fields: [adminRawProcessingLog.rowId],
		references: [adminRawUploadRows.id]
	}),
	fabric: one(fabrics, {
		fields: [adminRawProcessingLog.fabricId],
		references: [fabrics.id]
	}),
}));

export const aiPromptLogsRelations = relations(aiPromptLogs, ({one}) => ({
	fabric: one(fabrics, {
		fields: [aiPromptLogs.fabricId],
		references: [fabrics.id]
	}),
	user: one(users, {
		fields: [aiPromptLogs.actorId],
		references: [users.id]
	}),
}));