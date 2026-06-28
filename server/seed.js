const db = require('./config/db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Clear existing data (Optional, handle with care)
    // await db.query('TRUNCATE users, workspaces, boards, lists, cards CASCADE');

    // 1. Create Dummy User
    const passwordHash = await bcrypt.hash('password123', 10);
    const userResult = await db.query(
      'INSERT INTO users (username, password_hash, email, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
      ['admin', passwordHash, 'admin@decko.com', 'Administrator']
    );
    const userId = userResult.rows[0].id;

    // 2. Create Workspace
    const wsResult = await db.query(
      'INSERT INTO workspaces (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id',
      ['Proyek UTAMA', 'Ruang kerja kolaboratif utama untuk pengembangan Decko.', userId]
    );
    const wsId = wsResult.rows[0].id;

    // Add user as admin to workspace
    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [wsId, userId, 'Owner']
    );

    // 3. Create Board
    const boardResult = await db.query(
      'INSERT INTO boards (workspace_id, name, invitation_code) VALUES ($1, $2, $3) RETURNING id',
      [wsId, 'Kanban Pengembangan', 'DK-TEST']
    );
    const boardId = boardResult.rows[0].id;

    // 4. Create Lists
    const listNames = ['To do', 'In Progress', 'Done'];
    for (let i = 0; i < listNames.length; i++) {
        const listResult = await db.query(
            'INSERT INTO lists (board_id, name, order_index) VALUES ($1, $2, $3) RETURNING id',
            [boardId, listNames[i], i]
        );
        const listId = listResult.rows[0].id;

        // 5. Add a dummy card to "To do"
        if (listNames[i] === 'To do') {
            await db.query(
                'INSERT INTO cards (list_id, title, description, order_index, created_by) VALUES ($1, $2, $3, $4, $5)',
                [listId, 'Implementasi Fitur Dashboard', 'Membuat tampilan grid untuk workspace.', 0, userId]
            );
        }
    }

    console.log('Seeding completed successfully!');
    console.log('Dummy Account:');
    console.log('Username: admin');
    console.log('Password: password123');
    
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
