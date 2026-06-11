const DB_NAME = 'gushi_card_share'
const DB_VERSION = 1
const BOOK_STORE = 'books'

export interface Book {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(BOOK_STORE)) {
        const store = db.createObjectStore(BOOK_STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readonly')
    const store = tx.objectStore(BOOK_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const books = request.result as Book[]
      books.sort((a, b) => b.updatedAt - a.updatedAt)
      resolve(books)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readonly')
    const store = tx.objectStore(BOOK_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readwrite')
    const store = tx.objectStore(BOOK_STORE)
    const request = store.put(book)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readwrite')
    const store = tx.objectStore(BOOK_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
