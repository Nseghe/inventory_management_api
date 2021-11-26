// Put shared constants here

export const errorMessages = {
    insufficientQuantity: 'Insufficient item quantity to execute sell request',
    missingParamQuantity:
        'Please specify the quantity in your request body. The quantity value should be a positive integer.',
    missingParamExpiry: 'Please specify the expiry in your request body. The expiry value should be an integer.',
    uanbleToCompleteRequest: 'Unable to complete request. Please try again later.',
    dbQueryFailure: 'Unable to complete database query'
}

export const errorCodes = {
    pgConcurrentTransaction: '40001',
    pgDeadlock: '40P01'
}

export const itemsQueries = {
    getItemQuery:
        `SELECT
        EXTRACT(epoch FROM
        (SELECT expiry
            FROM items
            WHERE item = $1 AND expiry >= CURRENT_TIMESTAMP
            ORDER BY expiry
            LIMIT 1)
        ) * 1000 AS valid_until,
        COALESCE(SUM(quantity), 0) AS total_quantity
        FROM items
        WHERE item = $1 AND expiry >= CURRENT_TIMESTAMP;`,
    addItemsQuery:
        `INSERT INTO items(item, quantity, expiry)
        VALUES ($1, $2, TO_TIMESTAMP(CAST($3 AS BIGINT)/1000.0))`,
    getItemQuantityQuery:
        `SELECT
        COALESCE(SUM(quantity), 0) AS total_quantity
        FROM items
        WHERE item = $1 AND expiry >= CURRENT_TIMESTAMP;`,
    getFirstItemQuery:
        `SELECT id, quantity
        FROM items
        WHERE item = $1 AND expiry >= CURRENT_TIMESTAMP AND quantity > 0
        ORDER BY expiry
        LIMIT 1`,
    updateItemQuantityQuery:
        `UPDATE items
        SET quantity = $2
        WHERE id = $1`,
    deleteItemQuery:
        `DELETE FROM items
        WHERE id = $1`,
    beginTransactionQuery:
        `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ`,
    rollbackTransactionQuery:
        `ROLLBACK`,
    commitTransactionQuery:
            `COMMIT`
}

export const retryParams = {
    dBQueryMaxRetries: 5,
    multiplier: 2,
    timeout: 50
}
