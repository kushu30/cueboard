export async function up(knex) {
  await knex.schema.alterTable('clients', (table) => {
    table.string('priority').notNullable().defaultTo('medium');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('priority');
  });
}