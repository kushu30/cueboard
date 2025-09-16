/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('company');
    table.string('contact_email').notNullable().unique();
    table.date('onboard_date');
    table.string('tags');
    table.string('owner');
    table.json('feature_flags');
    table.timestamps(true, true); // Adds created_at and updated_at
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('clients');
}