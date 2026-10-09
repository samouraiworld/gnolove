# Dev Report registry rollout

The YAML catalogue is authoritative: 59 canonical repositories, including the `gnolang/gnopls` → `gnoverse/gnopls` alias. Unavailable `gnolang/gnokey-mobile` is not ingested. The legacy environment list is ignored. Historical rows and report JSON are retained.

## Before deployment

1. Record the deployed image and database volume path. Ensure space for a second SQLite database and keep an independent volume snapshot.
2. Review the registry branches and aliases. GitHub must attest public visibility, canonical name and default branch before ingestion.
3. Run `go test -race -count=1 ./...` and `go build ./...` in `server`.
4. Obtain migration approval on the backend PR before merging: merging triggers the backend deployment workflow.

## Migration

Startup calls SQLite `VACUUM INTO` on a temporary file before AutoMigrate, verifies SQLite integrity and the legacy repository schema, then atomically publishes `<DATABASE_PATH>.before-dev-report-registry.sqlite`. Backup errors stop startup. A valid existing snapshot is retained on subsequent attempts. An invalid existing snapshot blocks startup: move it aside for investigation and retry the backup before authorizing migration. Interrupted temporary files cannot count as completed snapshots. Registry reconciliation is transactional: contribution and notable PR references move to canonical aliases. No history is deleted.

Startup resets public attestations before the first GitHub metadata check. Reads exclude unlisted or unattested repositories, including historical reports; metadata errors suppress prior activity. Catalogue rows remain visible with sync status, except private repositories. Failed contribution stages preserve the previous successful checkpoint and report incomplete sync. New repository backfills can require several cycles; absent metrics are not confirmed zero activity.

GitHub HTTP 500/502/503/504 responses and rate-limit errors use the same bounded retry policy for each current query/page: four attempts with 2/4/8-second delays. Authentication errors and ordinary permission failures stop immediately. Exhausted retries still leave the repository sync incomplete; they never advance its successful checkpoint. Retries preserve the page cursor and original cutoff. When no successful checkpoint exists or the previous cycle was incomplete, PR/issue/milestone passes restart from the beginning so partial rows cannot hide older history. Request contexts also cancel contribution HTTP calls.

## Acceptance after deployment

- `/repositories` returns the reviewed catalogue (59 entries unless a repository becomes private), with `gnoverse/gnopls` replacing the old name and mobile history retained.
- Wait for successful per-repository checkpoints; inspect logged failures and GitHub rate limits. Compare weekly/monthly core and Memba totals with stored rows.
- `/repositories/stats` counts recently merged old PRs by merge date, current open totals, and distinct period authors without join multiplication.
- Validate explicit core, all and custom scopes in Memba. A missing catalogue must not fall back from all to core.
- Confirm stored report JSON is intact and new reports derive scope from public registry rows.

## Rollback

Stop the service and copy the migrated database aside. Restore the pre-upgrade snapshot into the configured database volume. Remove stale `-wal` and `-shm` sidecars only while the service is stopped, then restart the recorded old image against the restored database. Do not use the old image against renamed references without restoring the paired database. Validate repositories, contributor reads and report history before reopening traffic. Activity ingested after the snapshot needs separate reconciliation.

## On-chain provenance

This migration does not purge or reindex chain data. Memba disables legacy package/vote activity until a separate index tied to a verified network and genesis can be delivered. Re-enabling requires chain/genesis evidence and a non-destructive reindex plan.
