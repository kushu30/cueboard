/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.text('google_access_token');
    table.text('google_refresh_token');
    table.bigInteger('google_token_expiry');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_access_token');
    table.dropColumn('google_refresh_token');
    table.dropColumn('google_token_expiry');
  });
}