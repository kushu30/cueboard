/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('interactions', (table) => {
    // Add a user_id column that links to the users table
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    // Drop the old, simple text column
    table.dropColumn('created_by');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('interactions', (table) => {
    table.dropColumn('user_id');
    table.string('created_by');
  });
}