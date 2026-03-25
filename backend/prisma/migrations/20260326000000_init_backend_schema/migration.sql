CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vesting_schedules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "grantor" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vesting_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "proposer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_votes" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "voter" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "streams" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "contract_stream_id" INTEGER NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "claimed_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claim_events" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "treasury_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "treasury_address" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "address" TEXT,
    "amount" DOUBLE PRECISION,
    "token" TEXT,
    "tx_hash" TEXT,
    "proposal_id" INTEGER,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "proposals_id_key" ON "proposals"("id");
CREATE UNIQUE INDEX "streams_contract_stream_id_key" ON "streams"("contract_stream_id");
CREATE UNIQUE INDEX "treasury_events_tx_hash_key" ON "treasury_events"("tx_hash");

CREATE INDEX "vesting_schedules_organization_id_beneficiary_idx" ON "vesting_schedules"("organization_id", "beneficiary");
CREATE INDEX "proposals_organization_id_status_idx" ON "proposals"("organization_id", "status");
CREATE INDEX "proposal_votes_proposal_id_created_at_idx" ON "proposal_votes"("proposal_id", "created_at");
CREATE INDEX "streams_organization_id_status_idx" ON "streams"("organization_id", "status");
CREATE INDEX "streams_sender_idx" ON "streams"("sender");
CREATE INDEX "streams_recipient_idx" ON "streams"("recipient");
CREATE INDEX "claim_events_stream_id_timestamp_idx" ON "claim_events"("stream_id", "timestamp");
CREATE INDEX "treasury_events_organization_id_timestamp_idx" ON "treasury_events"("organization_id", "timestamp");
CREATE INDEX "treasury_events_treasury_address_timestamp_idx" ON "treasury_events"("treasury_address", "timestamp");

ALTER TABLE "vesting_schedules"
    ADD CONSTRAINT "vesting_schedules_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "proposals"
    ADD CONSTRAINT "proposals_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "proposal_votes"
    ADD CONSTRAINT "proposal_votes_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "streams"
    ADD CONSTRAINT "streams_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "claim_events"
    ADD CONSTRAINT "claim_events_stream_id_fkey"
    FOREIGN KEY ("stream_id") REFERENCES "streams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "treasury_events"
    ADD CONSTRAINT "treasury_events_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
