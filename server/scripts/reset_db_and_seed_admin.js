const db = require('../config/db');
const bcrypt = require('bcrypt');

async function resetDbAndSeedAdmin() {
  try {
    console.log('Memulai reset database...');

    // 1. Truncate all tables in database
    await db.query(`
      TRUNCATE TABLE 
        users, 
        workspaces, 
        workspace_members, 
        boards, 
        lists, 
        cards, 
        card_members, 
        card_labels, 
        labels, 
        comments 
      CASCADE;
    `);
    console.log('Semua tabel database berhasil dibersihkan (TRUNCATE).');

    // 2. Hash admin password
    const adminPassword = 'DeckoAdmin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 3. Insert admin user
    const userResult = await db.query(`
      INSERT INTO users (username, email, password_hash, full_name) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, username, email;
    `, ['admin', 'admin@decko.com', hashedPassword, 'Admin Decko']);
    
    const admin = userResult.rows[0];
    console.log(`Akun Admin Dummy berhasil dibuat: Username = admin, Email = admin@decko.com, Password = ${adminPassword}`);

    // 4. Create default Group workspace for the admin
    const workspaceResult = await db.query(`
      INSERT INTO workspaces (name, description, owner_id, invitation_code) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id;
    `, ['Workspace Utama', 'Workspace utama admin Decko', admin.id, 'ADM123']);
    
    const wsId = workspaceResult.rows[0].id;
    console.log('Workspace Utama admin berhasil dibuat.');

    // 5. Add admin as workspace Owner
    await db.query(`
      INSERT INTO workspace_members (workspace_id, user_id, role) 
      VALUES ($1, $2, $3);
    `, [wsId, admin.id, 'Owner']);

    // 6. Create default board
    const boardResult = await db.query(`
      INSERT INTO boards (workspace_id, name, slug_id, invitation_code) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id;
    `, [wsId, 'Papan Utama', 'papan-utama', 'PRY123']);
    
    const boardId = boardResult.rows[0].id;
    console.log('Papan Utama berhasil dibuat.');

    // 7. Create default lists (Backlog, Berjalan, Selesai)
    await db.query(`
      INSERT INTO lists (board_id, name, color, is_final, order_index) VALUES 
      ($1, 'Backlog', '#ff4d4d', false, 1),
      ($1, 'Berjalan', '#0095ff', false, 2),
      ($1, 'Selesai', '#2ecc71', true, 3);
    `, [boardId]);
    console.log('Default lists (Backlog, Berjalan, Selesai) berhasil dibuat.');

    console.log('Reset database dan seeding admin berhasil diselesaikan!');
    process.exit(0);
  } catch (err) {
    console.error('Gagal mereset database:', err);
    process.exit(1);
  }
}

resetDbAndSeedAdmin();
