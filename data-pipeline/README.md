# TaskFlow Data Pipeline

This module demonstrates data pipeline experience - a key requirement for the trading firm role.

## Features

1. **Batch Processing**: Processes analytics events in batches using Celery
2. **ETL Operations**: Extract, Transform, Load pattern for analytics data
3. **Reporting Pipeline**: Generates daily/weekly reports
4. **Data Lifecycle Management**: Cleans up old data to maintain performance
5. **Metric Calculation**: Complex aggregations and productivity metrics

## Running the Pipeline

```bash
# Start Celery worker
celery -A pipeline_worker worker --loglevel=info

# Start Celery beat (scheduler)
celery -A pipeline_worker beat --loglevel=info
```

## Pipeline Tasks

- `process_analytics_batch`: Processes batches of analytics events
- `generate_daily_report`: Generates daily productivity reports
- `cleanup_old_analytics`: Maintains data lifecycle
- `calculate_productivity_metrics`: Computes complex metrics

## Relevance to Trading Firm Role

This demonstrates:
- Experience building data pipelines
- Batch processing capabilities
- ETL operations
- Data aggregation and reporting
- Background job processing (similar to trade data processing)

