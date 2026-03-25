# OrbitPay Backend Scaffold

This directory holds the off-chain backend assets that are being added incrementally through the backend issue track.

## Monitoring Contract

Issue `BK-10` establishes the monitoring contract before the API and indexer services land in the repo. The backend services should adopt the following observability surface:

- Structured logs emitted as JSON lines to stdout.
- A Prometheus-compatible `/metrics` endpoint on each service.
- An indexer lag gauge exposed in seconds.
- A database connectivity health gauge exposed as `1` for healthy and `0` for unhealthy.

## Structured Logging Schema

Every backend log line should be a single JSON object with these fields:

```json
{
  "timestamp": "2026-03-25T17:00:00.000Z",
  "level": "info",
  "service": "api",
  "event": "http_request_completed",
  "message": "request handled",
  "request_id": "req_01HXYZ",
  "issue": "BK-10",
  "metadata": {
    "method": "GET",
    "path": "/metrics",
    "status_code": 200,
    "duration_ms": 12
  }
}
```

Recommended log levels:

- `debug` for local diagnostics
- `info` for startup, requests, checkpoint updates, and routine task completion
- `warn` for retryable failures and lag threshold breaches
- `error` for sustained indexer failures, database probe failures, and process crashes

## Required Metrics

The backend services should publish these metrics:

- `orbitpay_api_requests_total`
- `orbitpay_api_request_duration_seconds`
- `orbitpay_indexer_last_processed_timestamp_seconds`
- `orbitpay_indexer_lag_seconds`
- `orbitpay_indexer_failures_total`
- `orbitpay_db_connection_up`
- `orbitpay_db_probe_failures_total`
- `orbitpay_process_uptime_seconds`

See [`backend/monitoring/README.md`](monitoring/README.md) for the Prometheus, alerting, and Grafana assets that consume these metrics.
