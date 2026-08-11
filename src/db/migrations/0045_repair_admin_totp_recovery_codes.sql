CREATE TABLE IF NOT EXISTS "admin_totp_recovery_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_totp_recovery_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_totp_recovery_codes_user_id_users_id_fk') THEN
        ALTER TABLE "admin_totp_recovery_codes" ADD CONSTRAINT "admin_totp_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_totp_recovery_codes_user_id_idx" ON "admin_totp_recovery_codes" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_totp_recovery_codes_code_hash_idx" ON "admin_totp_recovery_codes" USING btree ("code_hash");
