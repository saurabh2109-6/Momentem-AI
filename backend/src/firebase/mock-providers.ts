import * as fs from 'fs';
import * as path from 'path';

export class MockAuth {
  private usersFile: string;

  constructor(dbPath: string) {
    this.usersFile = path.join(dbPath, 'auth_users.json');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify([]));
    }
  }

  private readUsers(): any[] {
    try {
      const content = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private writeUsers(users: any[]) {
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
  }

  async verifyIdToken(token: string): Promise<any> {
    // Decodes the token. For mock, token is username or email
    const users = this.readUsers();
    // In mock mode, token format is "mock-token-uid"
    const uid = token.replace('mock-token-', '');
    const user = users.find((u) => u.uid === uid || u.email === token);
    
    if (!user) {
      throw new Error('Unauthorized: Invalid mock token');
    }

    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.username || '',
    };
  }

  async createUser(properties: { email: string; password?: string; displayName?: string }): Promise<any> {
    const users = this.readUsers();
    if (users.some((u) => u.email === properties.email)) {
      throw new Error('auth/email-already-exists');
    }

    const newUser = {
      uid: require('crypto').randomUUID(),
      email: properties.email,
      displayName: properties.displayName || '',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.writeUsers(users);
    return newUser;
  }

  async getUser(uid: string): Promise<any> {
    const users = this.readUsers();
    const user = users.find((u) => u.uid === uid);
    if (!user) {
      throw new Error('auth/user-not-found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<any> {
    const users = this.readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error('auth/user-not-found');
    }
    return user;
  }
}

export class MockDocumentSnapshot {
  constructor(
    public readonly id: string,
    private readonly dataObj: any
  ) {}

  get exists(): boolean {
    return this.dataObj !== undefined && this.dataObj !== null;
  }

  data(): any {
    return this.dataObj;
  }
}

export class MockQuerySnapshot {
  constructor(public readonly docs: MockDocumentSnapshot[]) {}
  get size(): number {
    return this.docs.length;
  }
  get empty(): boolean {
    return this.docs.length === 0;
  }
}

export class MockDocumentReference {
  constructor(
    private collectionPath: string,
    private docId: string,
    private dbPath: string
  ) {}

  private getFilePath(): string {
    return path.join(this.dbPath, `${this.collectionPath}.json`);
  }

  private readCollection(): Record<string, any> {
    const file = this.getFilePath();
    if (!fs.existsSync(file)) return {};
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  }

  private writeCollection(data: Record<string, any>) {
    fs.writeFileSync(this.getFilePath(), JSON.stringify(data, null, 2));
  }

  async get(): Promise<MockDocumentSnapshot> {
    const data = this.readCollection();
    return new MockDocumentSnapshot(this.docId, data[this.docId]);
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    const colData = this.readCollection();
    const oldVal = colData[this.docId] || {};
    
    // Simulate server Timestamp fields conversion for dates
    const serializedData = this.serializeDates(data);

    if (options?.merge) {
      colData[this.docId] = { ...oldVal, ...serializedData };
    } else {
      colData[this.docId] = serializedData;
    }
    this.writeCollection(colData);
  }

  async update(data: any): Promise<void> {
    const colData = this.readCollection();
    if (!colData[this.docId]) {
      throw new Error(`Document not found: ${this.docId}`);
    }
    const serializedData = this.serializeDates(data);
    colData[this.docId] = { ...colData[this.docId], ...serializedData };
    this.writeCollection(colData);
  }

  async delete(): Promise<void> {
    const colData = this.readCollection();
    delete colData[this.docId];
    this.writeCollection(colData);
  }

  private serializeDates(obj: any): any {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const out: any = {};
      for (const k of Object.keys(obj)) {
        out[k] = this.serializeDates(obj[k]);
      }
      return out;
    }
    return obj;
  }
}

export class MockQuery {
  protected filters: Array<{ field: string; op: string; value: any }> = [];
  protected limitVal?: number;
  protected sortField?: string;
  protected sortDir?: 'asc' | 'desc';

  constructor(
    protected collectionPath: string,
    protected dbPath: string
  ) {}

  private getFilePath(): string {
    return path.join(this.dbPath, `${this.collectionPath}.json`);
  }

  protected readAllDocs(): Array<{ id: string; data: any }> {
    const file = this.getFilePath();
    if (!fs.existsSync(file)) return [];
    try {
      const colData = JSON.parse(fs.readFileSync(file, 'utf8'));
      return Object.keys(colData).map((id) => ({ id, data: colData[id] }));
    } catch {
      return [];
    }
  }

  where(field: string, op: string, value: any): MockQuery {
    this.filters.push({ field, op, value });
    return this;
  }

  limit(n: number): MockQuery {
    this.limitVal = n;
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): MockQuery {
    this.sortField = field;
    this.sortDir = direction;
    return this;
  }

  async get(): Promise<MockQuerySnapshot> {
    let docs = this.readAllDocs();

    // Filter documents
    for (const f of this.filters) {
      docs = docs.filter((doc) => {
        const val = doc.data[f.field];
        if (f.op === '==') return val === f.value;
        if (f.op === '!=') return val !== f.value;
        if (f.op === '>') return val > f.value;
        if (f.op === '>=') return val >= f.value;
        if (f.op === '<') return val < f.value;
        if (f.op === '<=') return val <= f.value;
        if (f.op === 'array-contains') return Array.isArray(val) && val.includes(f.value);
        return true;
      });
    }

    // Sort documents
    if (this.sortField) {
      const sf = this.sortField;
      const dir = this.sortDir === 'desc' ? -1 : 1;
      docs.sort((a, b) => {
        const valA = a.data[sf];
        const valB = b.data[sf];
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    // Apply limit
    if (this.limitVal !== undefined) {
      docs = docs.slice(0, this.limitVal);
    }

    return new MockQuerySnapshot(
      docs.map((d) => new MockDocumentSnapshot(d.id, d.data))
    );
  }
}

export class MockCollectionReference extends MockQuery {
  doc(id?: string): MockDocumentReference {
    const finalId = id || require('crypto').randomUUID();
    return new MockDocumentReference(this.collectionPath, finalId, this.dbPath);
  }

  async add(data: any): Promise<MockDocumentReference> {
    const id = require('crypto').randomUUID();
    const docRef = this.doc(id);
    await docRef.set(data);
    return docRef;
  }
}

export class MockFirestore {
  constructor(private dbPath: string) {
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
  }

  collection(name: string): MockCollectionReference {
    return new MockCollectionReference(name, this.dbPath);
  }
}

export class MockStorage {
  async upload(filePath: string, options?: any): Promise<any> {
    return [{ mediaUrl: 'https://storage.googleapis.com/mock-bucket/placeholder.png' }];
  }
}
