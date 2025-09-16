import crypto from 'crypto';

export async function up(knex) {
  // Step 1: Add the column but allow it to be null initially
  await knex.schema.alterTable('teams', (table) => {
    table.string('invite_code').unique();
  });

  // Step 2: Backfill any existing teams with a unique invite code
  const teams = await knex.select('id').from('teams');
  for (const team of teams) {
    await knex('teams')
      .where('id', team.id)
      .update({ invite_code: crypto.randomBytes(8).toString('hex') });
  }

  // From here on, our application logic will ensure the code is always set for new teams.
}

export async function down(knex) {
  await knex.schema.alterTable('teams', (table) => {
    table.dropColumn('invite_code');
  });
}