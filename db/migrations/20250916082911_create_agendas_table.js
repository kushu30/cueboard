export async function up(knex) {
  await knex.schema.createTable('agendas', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('client_id').unsigned().notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.text('discussion_points').defaultTo('');
    table.string('status').notNullable().defaultTo('pending'); // pending, done
    table.date('agenda_date').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('agendas');
}