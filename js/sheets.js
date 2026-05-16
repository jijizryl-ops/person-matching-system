const Sheets = {
  async call(action, payload = {}) {
    const params = new URLSearchParams({ action, ...payload });
    try {
      const res  = await fetch(`${CONFIG.SCRIPT_URL}?${params}`);
      return await res.json();
    } catch(e) { return { success: false, error: e.message }; }
  },
  async post(action, payload = {}) {
    try {
      const res  = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
      });
      return await res.json();
    } catch(e) { return { success: false, error: e.message }; }
  },
  async getUsers()           { return this.call('getAll', { sheet: SHEETS.USERS }); },
  async addUser(row)         { return this.post('append', { sheet: SHEETS.USERS, row: JSON.stringify(row) }); },
  async updateUser(id, row)  { return this.post('update', { sheet: SHEETS.USERS, id, row: JSON.stringify(row) }); },
  async deleteUser(id)       { return this.post('delete', { sheet: SHEETS.USERS, id }); },
  async getResidents()          { return this.call('getAll', { sheet: SHEETS.RESIDENTS }); },
  async addResident(row)        { return this.post('append', { sheet: SHEETS.RESIDENTS, row: JSON.stringify(row) }); },
  async updateResident(id, row) { return this.post('update', { sheet: SHEETS.RESIDENTS, id, row: JSON.stringify(row) }); },
  async deleteResident(id)      { return this.post('delete', { sheet: SHEETS.RESIDENTS, id }); },
  async getBlotters()           { return this.call('getAll', { sheet: SHEETS.BLOTTERS }); },
  async addBlotter(row)         { return this.post('append', { sheet: SHEETS.BLOTTERS, row: JSON.stringify(row) }); },
  async updateBlotter(id, row)  { return this.post('update', { sheet: SHEETS.BLOTTERS, id, row: JSON.stringify(row) }); },
  async deleteBlotter(id)       { return this.post('delete', { sheet: SHEETS.BLOTTERS, id }); },
};
