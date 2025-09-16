export async function up(knex) {
  await knex.schema.alterTable('clients', (table) => {
    table.string('website_url');
    table.integer('contact_cadence_days').defaultTo(7);
    table.text('prep_notes').defaultTo('');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('website_url');
    table.dropColumn('contact_cadence_days');
    table.dropColumn('prep_notes');
  });
}