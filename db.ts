
import type { TimelineEvent, Document, CaseMetadata } from './types';

const DB_NAME = 'JTR_Persistence_Layer';
const DB_VERSION = 2; // Upgraded for Split-Store Architecture

export class PersistenceLayer {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Database error: ", (event.target as any).error);
        reject("Failed to open database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Cases Store
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        
        // Events Store
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('caseId', 'caseId', { unique: false });
        }
        
        // Documents Metadata Store
        if (!db.objectStoreNames.contains('documents')) {
          const docsStore = db.createObjectStore('documents', { keyPath: 'id' });
          docsStore.createIndex('caseId', 'caseId', { unique: false });
        }

        // New Blob Store for heavy content (v2)
        if (!db.objectStoreNames.contains('document_blobs')) {
            db.createObjectStore('document_blobs', { keyPath: 'id' });
        }
      };
    });
  }

  // --- Case Management ---

  async getAllCases(): Promise<CaseMetadata[]> {
    return this.getAll<CaseMetadata>('cases');
  }

  async saveCase(caseMeta: CaseMetadata): Promise<void> {
    return this.put('cases', caseMeta);
  }

  // --- Events ---

  async getEventsByCase(caseId: string): Promise<TimelineEvent[]> {
    return this.getByIndex<TimelineEvent>('events', 'caseId', caseId);
  }

  async saveEvent(event: TimelineEvent): Promise<void> {
    return this.put('events', event);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.delete('events', id);
  }

  // --- Documents (Split-Store Logic) ---

  async getDocumentsByCase(caseId: string): Promise<Document[]> {
    // Returns METADATA ONLY for fast loading
    return this.getByIndex<Document>('documents', 'caseId', caseId);
  }

  async getDocumentContent(id: string): Promise<{content?: string, mediaData?: string} | null> {
      try {
          const blobData = await this.get('document_blobs', id);
          return blobData || null;
      } catch (e) {
          console.error("Failed to load document content blob", e);
          return null;
      }
  }

  async saveDocument(doc: Document): Promise<void> {
    // 1. Separate Metadata and Blobs
    const { content, mediaData, ...metadata } = doc;
    const blobData = { id: doc.id, content, mediaData };

    // 2. Transactional Write
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("DB not initialized");
        
        const transaction = this.db.transaction(['documents', 'document_blobs'], 'readwrite');
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        const metaStore = transaction.objectStore('documents');
        const blobStore = transaction.objectStore('document_blobs');

        metaStore.put(metadata);
        blobStore.put(blobData);
    });
  }

  async deleteDocument(id: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!this.db) return reject("DB not initialized");
        const transaction = this.db.transaction(['documents', 'document_blobs'], 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        transaction.objectStore('documents').delete(id);
        transaction.objectStore('document_blobs').delete(id);
      });
  }


  // --- Helpers ---

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T> {
      return new Promise((resolve, reject) => {
          if (!this.db) return reject("DB not initialized");
          const transaction = this.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
       if (!this.db) return reject("DB not initialized");
       const transaction = this.db.transaction([storeName], 'readwrite');
       const store = transaction.objectStore(storeName);
       const request = store.delete(id);
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
    });
  }
}

export const db = new PersistenceLayer();
