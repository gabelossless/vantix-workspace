use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::str::FromStr;

pub async fn init_db(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    let options = SqliteConnectOptions::from_str(&format!("sqlite://{}?mode=rwc", db_path))?
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal);

    let pool = SqlitePool::connect_with(options).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS system_health (id INTEGER PRIMARY KEY, boot_time TEXT);",
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}
