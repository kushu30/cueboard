/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Create a 'teams' table
  await knex.schema.createTable('teams', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true, true);
  });

  // 2. Create a 'users' table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
    table.timestamps(true, true);
  });

  // 3. Add the 'team_id' column to the existing 'clients' table
  await knex.schema.alterTable('clients', (table) => {
    table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('SET NULL');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop in reverse order of creation
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('team_id');
  });
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('teams');
}