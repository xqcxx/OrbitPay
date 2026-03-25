# OrbitPay Monitoring

This folder contains the repo-local monitoring scaffold for `BK-10`.

## Files

- `prometheus.yml` scrapes the future `api` and `indexer` services.
- `alerts.yml` defines alert rules for indexer lag, indexer failures, and database health.
- `grafana/orbitpay-backend-dashboard.json` provides a dashboard template for the backend stack.

## Expected Service Endpoints

When the backend services are added, expose:

- API metrics at `http://api:8080/metrics`
- Indexer metrics at `http://indexer:8081/metrics`

## Metrics Used By The Alerts

- `orbitpay_indexer_lag_seconds`
- `orbitpay_indexer_failures_total`
- `orbitpay_db_connection_up`
- `orbitpay_db_probe_failures_total`
- `up`

## Alert Intent

- Detect when the indexer falls more than 5 minutes behind.
- Detect when the indexer stops responding to Prometheus.
- Detect repeated indexer failures.
- Detect database connectivity loss or repeated failed probes.

These configs are ready to be mounted into Prometheus and Grafana as soon as the backend services are introduced.
