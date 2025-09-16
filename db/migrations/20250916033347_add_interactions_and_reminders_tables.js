/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('interactions', (table) => {
    table.increments('id').primary();
    table.integer('client_id').unsigned().notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.string('type').notNullable(); // e.g., 'email', 'call', 'meeting'
    table.text('notes');
    table.string('created_by');
    table.date('next_action_date');
    table.timestamp('date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('reminders', (table) => {
    table.increments('id').primary();
    table.integer('client_id').unsigned().notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.string('rule').notNullable(); // e.g., 'no-contact-30-days'
    table.string('status').defaultTo('pending'); // 'pending', 'sent', 'dismissed'
    table.timestamp('scheduled_at').notNullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('reminders');
  await knex.schema.dropTableIfExists('interactions');
}